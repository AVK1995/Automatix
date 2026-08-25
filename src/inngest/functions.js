import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { SYSTEM_STATUS, NODE_TYPES } from "@/constants";
import { checkAndLogUsage, RateLimitExceeded } from "@/actions/rateLimit";
import nodemailer from 'nodemailer';
import { GoogleAuth } from 'google-auth-library';
import { del } from '@vercel/blob';
import { sendMail } from '@/lib/mail';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { cleanValueForSheets } from '@/lib/dateUtils';
import { getGoogleAccessToken } from '@/lib/googleAuth';
import { executeGoogleSheetsAction } from '@/lib/sheetsExecutor';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const executeWorkflow = inngest.createFunction(
  { 
    id: "execute-workflow", 
    name: "Execute Workflow Engine",
    triggers: { event: "engine/workflow.start" }
  },
  async ({ event, step }) => {
    const { executionLogId, skipNodes = [], runOnlyNodeId = null } = event.data;

    // 1. Fetch Execution Log & Workflow
    const execution = await step.run("Fetch Workflow Data", async () => {
      return prisma.executionLog.findUnique({
        where: { id: executionLogId },
        include: { workflow: true },
      });
    });

    if (!execution || !execution.workflow) {
       throw new Error("Execution Log or Workflow not found");
    }

    const nodes = Array.isArray(execution.workflow.nodesJson) 
        ? execution.workflow.nodesJson 
        : [];

    // Isolated Run Logic (Manual Step Rerun)
    if (runOnlyNodeId) {
      const node = nodes.find(n => n.id === runOnlyNodeId);
      if (!node) throw new Error("Node not found for isolated execution");

      await step.run(`Isolated Execution (Node ${node.id})`, async () => {
        try {
          console.log(`[ISOLATED] Executing Action [${node.title}]:`, node.config);
          if (node.config?.simulateFailure) throw new Error("Simulated Failure");
          
          await prisma.analyticsEvent.create({
            data: {
              executionLogId,
              eventType: `NODE_MANUAL_RERUN_SUCCESS`,
              metadata: { nodeId: node.id, message: `Successfully re-ran step: ${node.title}` }
            }
          });
        } catch (error) {
          await prisma.analyticsEvent.create({
            data: {
              executionLogId,
              eventType: `NODE_MANUAL_RERUN_FAIL`,
              metadata: { nodeId: node.id, error: error.message }
            }
          });
        }
      });
      return { success: true, isolatedRun: true, runOnlyNodeId };
    }

    const resolveVars = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(/\{\{([^}]+)\}\}/g, (match, rawPath) => {
        const path = rawPath.trim();
        if (path.startsWith('trigger.body.')) {
          const rawKey = path.slice('trigger.body.'.length);
          const payload = execution.currentNodeState?.payload;
          if (payload && payload[rawKey] !== undefined) {
            return payload[rawKey];
          }
          const keyPath = rawKey.replace(/\[/g, '.').replace(/\]/g, '');
          let current = payload;
          for (const k of keyPath.split('.')) {
            if (current === undefined || current === null) return match;
            current = current[k];
          }
          return current !== undefined ? current : match;
        } else if (path.startsWith('steps.')) {
          const parts = path.split('.');
          if (parts.length >= 2) {
            const sId = parts[1];
            let current = execution.currentNodeState?.stepOutputs?.[sId];
            if (parts.length === 2) {
              return current !== undefined ? (typeof current === 'object' ? (current.result ?? current.output ?? current.reply_text ?? JSON.stringify(current)) : current) : match;
            }
            const rawKey = parts.slice(2).join('.');
            if (current && typeof current === 'object' && current[rawKey] !== undefined) {
              return current[rawKey];
            }
            if (current && typeof current === 'object' && current.output && current.output[rawKey] !== undefined) {
              return current.output[rawKey];
            }
            const keyPath = parts.slice(2).join('.').replace(/\[/g, '.').replace(/\]/g, '').split('.');
            if (current) {
              for (const k of keyPath) {
                if (current === undefined || current === null) return match;
                current = current[k];
              }
              return current !== undefined ? current : match;
            }
          }
        } else if (path.includes(':')) {
          const [titlePart, propPart] = path.split(':').map(s => s.trim());
          const targetNode = nodes.find(n => (n.title || '').trim().toLowerCase() === titlePart.toLowerCase());
          if (targetNode) {
            const current = execution.currentNodeState?.stepOutputs?.[targetNode.id];
            if (current && current[propPart] !== undefined) {
              return current[propPart];
            }
            if (current && typeof current === 'object' && current.output && current.output[propPart] !== undefined) {
              return current.output[propPart];
            }
          }
        }
        return match;
      });
    };

    let hasFailedStep = false;

    const executeNodeTree = async (parentId = null, pathId = null) => {
      const childNodes = nodes.filter(n => (n.parentId || null) === parentId && (n.pathId || null) === pathId);
      
      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        if (hasFailedStep) break;

        if (skipNodes.includes(node.id)) {
          await step.run(`Skip Node ${node.id}`, async () => {
            await prisma.analyticsEvent.create({
              data: {
                executionLogId,
                eventType: `NODE_SKIPPED`,
                metadata: { nodeId: node.id, title: node.title }
              }
            });
          });
          await executeNodeTree(node.id, null);
          continue;
        }

        const isTest = execution.currentNodeState?.isTest === true;
        const testPayload = execution.currentNodeState?.payload || {};

        if (isTest && (node.type === NODE_TYPES.ACTION || node.type === NODE_TYPES.FORMATTER || node.integration?.id?.includes('formatter') || node.integrationId === 'custom_variable')) {
           let vars = new Set();
           const search = (item) => {
             if (typeof item === 'string') {
               const matches = item.match(/\{\{([^}]+)\}\}/g);
               if (matches) matches.forEach(m => vars.add(m.replace(/[{}]/g, '')));
             } else if (typeof item === 'object' && item !== null) {
               Object.values(item).forEach(search);
             }
           };
           search(node.config || {});

           let isMissing = false;
           let missingVar = '';
           for (const v of vars) {
             if (v.startsWith('trigger.body.')) {
                const keyPath = v.replace('trigger.body.', '');
                let current = testPayload;
                for (const k of keyPath.split('.')) {
                   if (current === undefined || current === null) { isMissing = true; missingVar = v; break; }
                   current = current[k];
                }
                if (current === undefined || current === null) { isMissing = true; missingVar = v; }
             }
             if (isMissing) break;
           }

           if (isMissing) {
             await step.run(`Skip Node ${node.id} (Data Mismatch)`, async () => {
               await prisma.analyticsEvent.create({
                 data: {
                   executionLogId,
                   eventType: `NODE_SKIPPED`,
                   metadata: { nodeId: node.id, title: node.title, reason: `Skipped due to data structure mismatch: ${missingVar}` }
                 }
               });
             });
             await executeNodeTree(node.id, null);
             continue;
           }
        }

        await step.run(`Update State: Node ${node.id}`, async () => {
          await prisma.executionLog.update({
            where: { id: executionLogId },
            data: { currentNodeState: { ...(execution.currentNodeState || {}), step: node.type, nodeId: node.id, title: node.title } }
          });
        });

        if (node.type === NODE_TYPES.DELAY || node.integration?.id === 'delay' || node.integrationId === 'delay') {
          const delayType = node.config?.delayType || 'duration';

          if (!delayType || delayType === 'duration') {
            const amount = parseInt(node.config?.duration || 1);
            const unit = node.config?.unit || 'minutes';
            
            // Format for Inngest sleep (e.g. "1m", "2h", "5d")
            const unitChar = unit.charAt(0).toLowerCase(); 
            const sleepDuration = `${amount}${unitChar}`;
            
            await step.run(`Set Waiting Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'WAITING', currentNodeState: { ...(execution.currentNodeState || {}), step: 'DELAY', nodeId: node.id, title: node.title } }
              });
            });

            await step.sleep(`Sleep for Node ${node.id}`, sleepDuration);

            await step.run(`Set Active Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'ACTIVE' }
              });
            });
            
            await step.run(`Log Delay Complete (Node ${node.id})`, async () => {
              await prisma.analyticsEvent.create({
                data: { executionLogId, eventType: `NODE_DELAY_COMPLETE`, metadata: { nodeId: node.id, type: 'duration', duration: sleepDuration } }
              });
            });
          }
          else if (delayType === 'wait_for_reply') {
            const amount = parseInt(node.config?.duration || 1);
            const unit = node.config?.unit || 'minutes';
            
            const unitChar = unit.charAt(0).toLowerCase(); 
            const sleepDuration = `${amount}${unitChar}`;
            
            await step.run(`Set Waiting Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'WAITING', currentNodeState: { ...(execution.currentNodeState || {}), step: 'DELAY', nodeId: node.id, title: node.title } }
              });
            });

            const resumeEvent = await step.waitForEvent(`Wait for Reply (Node ${node.id})`, {
              event: `workflow.resume.${node.id}`,
              timeout: sleepDuration,
              match: 'data.executionLogId'
            });

            await step.run(`Set Active Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'ACTIVE' }
              });
            });
            
            if (resumeEvent && resumeEvent.data && resumeEvent.data.payload) {
              if (!execution.currentNodeState) execution.currentNodeState = {};
              execution.currentNodeState.payload = resumeEvent.data.payload;
              
              const text = resumeEvent.data.payload?.entry?.[0]?.messaging?.[0]?.message?.text || '';
              if (!execution.currentNodeState.stepOutputs) execution.currentNodeState.stepOutputs = {};
              execution.currentNodeState.stepOutputs[node.id] = { 
                output: resumeEvent.data.payload,
                reply_text: text 
              };
              
              await step.run(`Update State Payload (Node ${node.id})`, async () => {
                await prisma.executionLog.update({
                  where: { id: executionLogId },
                  data: { currentNodeState: execution.currentNodeState }
                });
              });
            }

            await step.run(`Log Delay Complete (Node ${node.id})`, async () => {
              await prisma.analyticsEvent.create({
                data: { executionLogId, eventType: `NODE_DELAY_COMPLETE`, metadata: { nodeId: node.id, type: 'wait_for_reply', duration: sleepDuration, bypassed: !!resumeEvent } }
              });
            });

            if (!resumeEvent && node.config?.passOnTimeout !== true) {
              await step.run(`Halt on Timeout (Node ${node.id})`, async () => {
                await prisma.analyticsEvent.create({
                  data: { executionLogId, eventType: `WORKFLOW_HALTED`, metadata: { reason: 'timeout', nodeId: node.id } }
                });
              });
              return; // Halt execution for this path
            }
          } 
          else if (delayType === 'until' || delayType === 'event_based') {
            const rawDateStr = delayType === 'until' ? node.config?.untilDate : node.config?.eventDate;
            
            const targetDateStr = await step.run(`Calculate Target Date (Node ${node.id})`, async () => {
               let date = new Date(rawDateStr);
               if (isNaN(date.getTime())) {
                 console.warn(`Invalid date format for delay: ${rawDateStr}. Falling back to +1 min.`);
                 date = new Date(Date.now() + 60000);
               }

               if (delayType === 'event_based') {
                 const amount = parseInt(node.config?.duration || 1);
                 const unit = node.config?.unit || 'minutes';
                 const timing = node.config?.eventTiming || 'before';
                 
                 let multiplier = 1;
                 if (unit === 'minutes') multiplier = 60 * 1000;
                 else if (unit === 'hours') multiplier = 60 * 60 * 1000;
                 else if (unit === 'days') multiplier = 24 * 60 * 60 * 1000;

                 const timeShift = amount * multiplier;
                 
                 if (timing === 'before') {
                   date = new Date(date.getTime() - timeShift);
                 } else {
                   date = new Date(date.getTime() + timeShift);
                 }
               }

               if (date.getTime() < Date.now()) {
                 date = new Date(); 
               }

               return date.toISOString();
            });

            await step.run(`Set Waiting Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'WAITING', currentNodeState: { ...(execution.currentNodeState || {}), step: 'DELAY', nodeId: node.id, title: node.title } }
              });
            });

            const resumeEvent = await step.waitForEvent(`Wait until for Node ${node.id}`, {
              event: 'workflow.resume',
              timeout: new Date(targetDateStr),
              match: 'data.executionLogId'
            });

            await step.run(`Set Active Status (Node ${node.id})`, async () => {
              await prisma.executionLog.update({
                where: { id: executionLogId },
                data: { status: 'ACTIVE' }
              });
            });

            await step.run(`Log Delay Complete (Node ${node.id})`, async () => {
              await prisma.analyticsEvent.create({
                data: { executionLogId, eventType: `NODE_DELAY_COMPLETE`, metadata: { nodeId: node.id, type: delayType, targetDate: targetDateStr, bypassed: !!resumeEvent } }
              });
            });
          }
          await executeNodeTree(node.id, null);
        } else if (node.type === NODE_TYPES.ACTION) {
          const isActive = await step.run(`Check Kill Switch (Node ${node.id})`, async () => {
            const currentLog = await prisma.executionLog.findUnique({
              where: { id: executionLogId },
              select: { status: true }
            });
            return currentLog?.status === SYSTEM_STATUS.ACTIVE;
          });

          if (!isActive) {
            await step.run("Abort Workflow", async () => {
              console.log(`Workflow ${executionLogId} aborted due to Kill Switch.`);
            });
            hasFailedStep = true;
            return;
          }

          const actionResult = await step.run(`Execute Action (Node ${node.id})`, async () => {
            try {
              const trackingId = node.config?.connectionId || node.integrationId;
              if (trackingId && !['http', 'sheets', 'formatter_text', 'formatter_math', 'formatter_datetime', 'json_parser', 'custom_variable', 'date_formatter', 'code', 'delay', 'condition'].includes(trackingId)) {
                 const connection = await prisma.integration.findUnique({ where: { id: trackingId } });
                 if (connection) {
                   const wfOwner = await prisma.user.findUnique({ where: { id: execution.workflow.clientId }});
                   await checkAndLogUsage(trackingId, wfOwner?.quotaTier || 'free');
                 }
              }

              console.log(`Executing Action [${node.title}]:`, node.config);
              if (node.config?.simulateFailure) throw new Error("Simulated Failure");
                            let output = null;

                // --- 1. FORMATTER TEXT ---
                if (node.integrationId === 'formatter_text' || node.integration?.id === 'formatter_text') {
                  let rawInput = node.config.input ? resolveVars(node.config.input) : '';
                  if (typeof rawInput !== 'string') rawInput = String(rawInput);
                  let result = rawInput;
                  
                  const op = node.config.operation;
                  if (op === 'extract_data') {
                    const type = node.config.extractType || 'email';
                    if (type === 'email') {
                      const match = rawInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                      result = match ? match[0] : null;
                    } else if (type === 'phone') {
                      const match = rawInput.match(/(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\d{2,4}[\s-]?){2,4}\d{2,4}/);
                      result = match ? match[0] : null;
                    } else if (type === 'url') {
                      const match = rawInput.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
                      result = match ? match[0] : null;
                    } else if (type === 'number') {
                      const match = rawInput.match(/\d+/);
                      result = match ? match[0] : null;
                    } else if (type === 'name') {
                      const match = rawInput.match(/(?:my name is|i am|i'm|this is|it is|it's|call me|name is)\s+([a-zA-Z]+)/i);
                      if (match && match[1]) {
                        result = match[1];
                      } else {
                        if (rawInput.split(' ').length <= 2) result = rawInput.trim();
                        else result = rawInput;
                      }
                    }
                  } else if (op === 'uppercase') {
                    result = rawInput.toUpperCase();
                  } else if (op === 'lowercase') {
                    result = rawInput.toLowerCase();
                  } else if (op === 'capitalize') {
                    result = rawInput.replace(/\b\w/g, c => c.toUpperCase());
                  } else if (op === 'trim') {
                    result = rawInput.trim();
                  }
                  output = result;
                }
                // --- 2. FORMATTER MATH ---
                else if (node.integrationId === 'formatter_math' || node.integration?.id === 'formatter_math') {
                  const op = node.config.operation || 'add';
                  const valA = Number(resolveVars(node.config.valA || node.config.amount || 0));
                  const valB = Number(resolveVars(node.config.valB || node.config.step || 0));

                  if (op === 'add') output = valA + valB;
                  else if (op === 'subtract') output = valA - valB;
                  else if (op === 'multiply') output = valA * valB;
                  else if (op === 'divide') output = valB !== 0 ? valA / valB : 0;
                  else if (op === 'format_currency') {
                    const curr = resolveVars(node.config.currency || 'USD');
                    output = new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(valA);
                  } else if (op === 'format_number') {
                    const dec = parseInt(node.config.decimals || 2);
                    output = Number(valA.toFixed(dec));
                  } else if (op === 'format_phone') {
                    const rawPhone = String(valA).replace(/\D/g, '');
                    output = rawPhone.length === 10 ? `(${rawPhone.slice(0,3)}) ${rawPhone.slice(3,6)}-${rawPhone.slice(6)}` : rawPhone;
                  } else if (op === 'counter') {
                    output = valA + (valB || 1);
                  } else {
                    output = valA;
                  }
                }
                // --- 3. FORMATTER EXTRACT ---
                else if (node.integrationId === 'formatter_extract' || node.integration?.id === 'formatter_extract') {
                  const rawSource = resolveVars(node.config.source || '');
                  const type = node.config.type || 'email';
                  if (type === 'email') {
                    const matches = rawSource.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                    output = matches ? matches[0] : null;
                  } else if (type === 'phone') {
                    const matches = rawSource.match(/(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\d{2,4}[\s-]?){2,4}\d{2,4}/g);
                    output = matches ? matches[0] : null;
                  } else if (type === 'url') {
                    const matches = rawSource.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);
                    output = matches ? matches[0] : null;
                  } else if (type === 'number') {
                    const matches = rawSource.match(/-?\d+(?:\.\d+)?/g);
                    output = matches ? Number(matches[0]) : null;
                  } else if (type === 'regex') {
                    const regex = new RegExp(node.config.regexPattern || '', 'g');
                    const matches = rawSource.match(regex);
                    output = matches ? (matches.length === 1 ? matches[0] : matches) : null;
                  } else {
                    output = rawSource;
                  }
                }
                // --- 4. CUSTOM JS CODE (FORMATTER DEV) ---
                else if (node.integrationId === 'formatter_dev' || node.integration?.id === 'formatter_dev' || node.integrationId === 'code' || node.integration?.id === 'code') {
                  const codeStr = node.config?.code || 'return null;';
                  const inputVal = node.config?.input ? resolveVars(node.config.input) : null;
                  try {
                    const dynamicFn = new Function('input', 'stepOutputs', 'trigger', 'dayjs', codeStr);
                    output = dynamicFn(inputVal, execution.currentNodeState?.stepOutputs, execution.currentNodeState?.payload, dayjs);
                  } catch (codeErr) {
                    throw new Error(`Custom JS Execution Error: ${codeErr.message}`);
                  }
                }
                // --- 5. CUSTOM VARIABLE ---
                else if (node.integrationId === 'custom_variable' || node.integration?.id === 'custom_variable') {
                  const { varType, varValue, useCurrentTime, varFormat, varTimezone } = node.config || {};
                  if (varType === 'timestamp') {
                    const tz = varTimezone || 'UTC';
                    if (useCurrentTime !== false) {
                      output = dayjs().tz(tz).format(varFormat || 'YYYY-MM-DD HH:mm:ss');
                    } else {
                      const parsed = dayjs.tz(varValue, tz);
                      if (parsed.isValid()) output = parsed.format(varFormat || 'YYYY-MM-DD HH:mm:ss');
                    }
                  } else if (varType === 'number') {
                    output = Number(varValue);
                  } else {
                    output = varValue;
                  }
                }
                // --- 6. DATE FORMATTER ---
                else if (node.integrationId === 'date_formatter' || node.integration?.id === 'date_formatter') {
                  const config = node.config || {};
                  const op = config.operation || 'format_timezone';
                  
                  if (op === 'duration') {
                    const startObj = dayjs.utc(config.startDate);
                    const endObj = dayjs.utc(config.endDate);
                    if (startObj.isValid() && endObj.isValid()) {
                      output = endObj.diff(startObj, config.durationUnit || 'days');
                    }
                  } else {
                    const sTz = config.sourceTz || 'UTC';
                    let dateObj = dayjs.tz(config.dateString, sTz);
                    if (dateObj.isValid()) {
                      if (op === 'add_subtract') {
                        const expr = (config.mathExpression || '').trim().toLowerCase();
                        if (expr) {
                          let sign = 1;
                          let workStr = expr;
                          if (workStr.startsWith('+')) {
                            sign = 1;
                            workStr = workStr.substring(1).trim();
                          } else if (workStr.startsWith('-')) {
                            sign = -1;
                            workStr = workStr.substring(1).trim();
                          }

                          const parts = workStr.split(/\s+/);
                          for (let i = 0; i < parts.length; i += 2) {
                            const amount = Number(parts[i]);
                            let unit = parts[i+1];
                            if (!isNaN(amount) && unit) {
                              if (!unit.endsWith('s')) unit += 's';
                              if (sign === 1) {
                                dateObj = dateObj.add(amount, unit);
                              } else {
                                dateObj = dateObj.subtract(amount, unit);
                              }
                            }
                          }
                        }
                      }
                      const tTz = config.targetTz || 'UTC';
                      let targetObj = dateObj.tz(tTz);
                      const formatStr = config.outputFormat || 'YYYY-MM-DD';
                      if (formatStr === 'X') output = targetObj.unix();
                      else if (formatStr === 'x') output = targetObj.valueOf();
                      else {
                        const finalFormat = formatStr.replace(/TZ/g, `[${tTz}]`);
                        output = targetObj.format(finalFormat);
                      }
                    }
                  }
                }
                // --- 7. CHECK CALENDAR STATUS ---
                else if (node.integrationId === 'calendar_status' || node.integration?.id === 'calendar_status') {
                  const bookingId = resolveVars(node.config?.bookingId || '');
                  if (bookingId) {
                    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
                    output = { booking, isCancelled: booking?.status === 'CANCELLED', isConfirmed: booking?.status === 'CONFIRMED' };
                    if (node.config?.actionIfCancelled === 'halt' && booking?.status === 'CANCELLED') {
                      hasFailedStep = true;
                      output.halted = true;
                    }
                  } else {
                    output = { status: 'NO_BOOKING_ID' };
                  }
                }
                // --- 8. API / HTTP WEBHOOK ---
                else if (node.integrationId === 'http' || node.integration?.id === 'http') {
                  const method = (node.config?.method || 'POST').toUpperCase();
                  const targetUrl = resolveVars(node.config?.url || '');
                  if (!targetUrl) throw new Error("HTTP Action: URL is required");

                  const headers = { 'Content-Type': 'application/json' };
                  if (node.config?.headers) {
                    const customHeaders = typeof node.config.headers === 'string' ? JSON.parse(node.config.headers) : node.config.headers;
                    Object.assign(headers, customHeaders);
                  }

                  let reqBody = undefined;
                  if (['POST', 'PUT', 'PATCH'].includes(method) && node.config?.body) {
                    const resolvedBodyStr = resolveVars(typeof node.config.body === 'object' ? JSON.stringify(node.config.body) : node.config.body);
                    try { reqBody = JSON.parse(resolvedBodyStr); } catch(e) { reqBody = resolvedBodyStr; }
                  }

                  const res = await fetch(targetUrl, {
                    method,
                    headers,
                    body: reqBody ? (typeof reqBody === 'string' ? reqBody : JSON.stringify(reqBody)) : undefined
                  });

                  let resData = null;
                  const contentType = res.headers.get('content-type') || '';
                  if (contentType.includes('application/json')) {
                    resData = await res.json();
                  } else {
                    resData = await res.text();
                  }

                  output = {
                    status: res.status,
                    statusText: res.statusText,
                    data: resData
                  };

                  if (!res.ok && node.config?.throwOnError !== false) {
                    throw new Error(`HTTP Request failed with status ${res.status}: ${JSON.stringify(resData)}`);
                  }
                }
                // --- 9. SEND EMAIL ---
                else if (node.integrationId === 'email' || node.integration?.id === 'email') {
                  const toEmail = resolveVars(node.config?.to || node.config?.recipient || '');
                  const subject = resolveVars(node.config?.subject || 'Notification from Automatix');
                  const bodyHtml = resolveVars(node.config?.body || node.config?.message || '');

                  if (!toEmail) throw new Error("Send Email: Recipient email is required");

                  const connectionId = node.config?.connectionId || node.integrationId;
                  let smtpConfig = null;
                  if (connectionId) {
                    const conn = await prisma.integration.findUnique({ where: { id: connectionId } });
                    if (conn?.apiKey) {
                      try { smtpConfig = JSON.parse(conn.apiKey); } catch(e) {}
                    }
                  }

                  const transporter = nodemailer.createTransport(smtpConfig ? {
                    host: smtpConfig.host,
                    port: smtpConfig.port || 587,
                    secure: smtpConfig.port == 465,
                    auth: { user: smtpConfig.user, pass: smtpConfig.pass }
                  } : {
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_PORT == 465,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                  });

                  const mailRes = await transporter.sendMail({
                    from: node.config?.from || process.env.SMTP_USER || 'no-reply@automatix.local',
                    to: toEmail,
                    subject,
                    html: bodyHtml
                  });

                  output = { messageId: mailRes.messageId, recipient: toEmail, success: true };
                }
                // --- 10. SLACK MESSAGE ---
                else if (node.integrationId === 'slack' || node.integration?.id === 'slack') {
                  const webhookUrl = resolveVars(node.config?.webhookUrl || '');
                  const messageText = resolveVars(node.config?.message || '');
                  if (!webhookUrl) throw new Error("Slack Action: Webhook URL is required");

                  const slackRes = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: messageText })
                  });
                  output = { status: slackRes.status, success: slackRes.ok };
                }
                // --- 11. SEND SMS (TWILIO) ---
                else if (node.integrationId === 'twilio' || node.integration?.id === 'twilio') {
                  const toPhone = resolveVars(node.config?.to || node.config?.recipient || '');
                  const messageBody = resolveVars(node.config?.body || node.config?.message || '');
                  
                  const connectionId = node.config?.connectionId || node.integrationId;
                  const conn = await prisma.integration.findUnique({ where: { id: connectionId } });
                  if (!conn) throw new Error("Twilio connection not found");

                  let twilioCreds = {};
                  try { twilioCreds = JSON.parse(conn.apiKey); } catch(e) {}
                  const accountSid = twilioCreds.accountSid || process.env.TWILIO_ACCOUNT_SID;
                  const authToken = twilioCreds.authToken || process.env.TWILIO_AUTH_TOKEN;
                  const fromNumber = node.config?.from || twilioCreds.fromNumber || process.env.TWILIO_FROM_NUMBER;

                  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                  const twilioRes = await fetch(twilioUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({ To: toPhone, From: fromNumber, Body: messageBody })
                  });
                  const twilioData = await twilioRes.json();
                  if (!twilioRes.ok) throw new Error(twilioData.message || 'Twilio API Error');
                  output = twilioData;
                }
                // --- 12. META CONVERSIONS API ---
                else if (node.integrationId === 'meta_capi' || node.integration?.id === 'meta_capi') {
                  const pixelId = resolveVars(node.config?.pixelId || '');
                  const eventName = resolveVars(node.config?.eventName || 'Lead');
                  
                  const connectionId = node.config?.connectionId || node.integrationId;
                  const conn = await prisma.integration.findUnique({ where: { id: connectionId } });
                  const accessToken = conn?.apiKey || process.env.META_ACCESS_TOKEN;

                  const capiUrl = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;
                  const capiRes = await fetch(capiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      data: [{
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'system_generated',
                        user_data: node.config?.userData ? JSON.parse(resolveVars(JSON.stringify(node.config.userData))) : {}
                      }]
                    })
                  });
                  output = await capiRes.json();
                }
                // --- 13. GOOGLE SHEETS ACTION ---
                else if (['sheets', 'google_sheets'].includes(node.integrationId) || ['sheets', 'google_sheets'].includes(node.integration?.id)) {
                  const accessToken = await getGoogleAccessToken(node.config?.connectionId, execution.workflow?.userId);
                  if (!accessToken) {
                    throw new Error('No active Google authentication token found for this step.');
                  }

                  output = await executeGoogleSheetsAction({
                    config: node.config || {},
                    accessToken,
                    resolveVars
                  });

                  if (output?.success === false) {
                    throw new Error(output.error || 'Google Sheets action failed');
                  }
                }
                // --- 14. FILTER ACTION ---
                else if (node.integrationId === 'filter' || node.integration?.id === 'filter') {
                  const varVal = resolveVars(node.config?.variable || node.config?.pathAVar || '');
                  const op = node.config?.operation || node.config?.pathAOp || 'equals';
                  const expectedVal = resolveVars(node.config?.value || node.config?.pathAVal || '');
                  const isCaseSensitive = node.config?.caseSensitive === true;

                  const a = isCaseSensitive ? String(varVal) : String(varVal).toLowerCase();
                  const e = isCaseSensitive ? String(expectedVal) : String(expectedVal).toLowerCase();

                  let isPass = false;
                  if (op === 'contains' && a.includes(e)) isPass = true;
                  else if (op === 'equals' && a === e) isPass = true;
                  else if (op === 'not_equals' && a !== e) isPass = true;
                  else if (op === 'starts_with' && a.startsWith(e)) isPass = true;
                  else if (op === 'ends_with' && a.endsWith(e)) isPass = true;
                  else if (op === 'exists' && varVal !== undefined && varVal !== null && varVal !== '') isPass = true;

                  if (!isPass) {
                    hasFailedStep = true;
                    output = { filtered: true, reason: 'Condition not met' };
                  } else {
                    output = { filtered: false, pass: true };
                  }
                }
                // --- 15. INSTAGRAM DM ACTION ---
                else if (node.integrationId === 'instagram_action' || node.integration?.id === 'instagram_action' || node.integrationId === 'interactive_prompt' || node.integration?.id === 'interactive_prompt') {
                    const { messageType, message, mediaUrl, questionType, options } = node.config || {};
                    
                    let finalMessageText = message ? resolveVars(message) : '';
                    if (messageType === 'quiz' && questionType === 'multiple_choice' && options) {
                      const opts = options.split(',').map(o => o.trim()).filter(Boolean);
                      if (opts.length > 0) {
                        finalMessageText += '\n\n' + opts.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
                      }
                    }

                    let recipientId = node.config?.recipient ? resolveVars(node.config.recipient) : null;
                    if (node.config?.recipientType === 'link' && recipientId) {
                      const usernameMatch = recipientId.match(/(?:instagram\.com\/)([a-zA-Z0-9_.]+)/i);
                      if (usernameMatch) recipientId = usernameMatch[1];
                    }
                    
                    // Fetch connection for API key
                    const connectionId = node.config?.connectionId || node.integrationId || node.id;
                    const connection = await prisma.integration.findUnique({
                      where: { id: connectionId }
                    });
                    if (!connection) throw new Error("Instagram connection not found");

                    let accessToken = connection.apiKey;
                    try {
                      const parsed = JSON.parse(connection.apiKey);
                      if (parsed.access_token) accessToken = parsed.access_token;
                    } catch(e) {}

                    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`;
                    let apiData = null;

                    // 1. Send Media if present
                    if (messageType === 'media' && mediaUrl) {
                      const mUrl = resolveVars(mediaUrl);
                      const cleanUrl = (mUrl || '').split('?')[0].toLowerCase();
                      let attachmentType = 'image';
                      if (cleanUrl.match(/\.(mp4|mov|avi|webm|mkv|m4v)$/)) {
                        attachmentType = 'video';
                      } else if (cleanUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
                        attachmentType = 'audio';
                      } else if (cleanUrl.match(/\.(pdf|doc|docx|zip|rar|tar|txt|csv)$/)) {
                        attachmentType = 'file';
                      }

                      const mediaPayload = {
                        recipient: { id: recipientId },
                        message: { attachment: { type: attachmentType, payload: { url: mUrl, is_reusable: true } } }
                      };
                      const mediaRes = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mediaPayload)
                      });
                      apiData = await mediaRes.json();
                      if (!mediaRes.ok) throw new Error(apiData.error?.message || 'Meta API Error (Media)');
                    }

                    // 2. Send Text if present
                    if (finalMessageText) {
                      const textPayload = {
                        recipient: { id: recipientId },
                        message: { text: finalMessageText }
                      };
                      const textRes = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(textPayload)
                      });
                      apiData = await textRes.json();
                      if (!textRes.ok) throw new Error(apiData.error?.message || 'Meta API Error (Text)');
                    }
                    
                    output = {
                      recipientType: node.config?.recipientType,
                      recipient: recipientId,
                      messageType,
                      mediaUrl: messageType === 'media' ? (mediaUrl ? resolveVars(mediaUrl) : undefined) : undefined,
                      sentText: finalMessageText,
                      apiResponse: apiData
                    };
                  }
                
                // Save output to stepOutputs
                if (output !== null && output !== undefined) {
                  if (!execution.currentNodeState) execution.currentNodeState = {};
                  if (!execution.currentNodeState.stepOutputs) execution.currentNodeState.stepOutputs = {};
                  execution.currentNodeState.stepOutputs[node.id] = { 
                    result: typeof output === 'object' && output !== null && output.result !== undefined ? output.result : output, 
                    output 
                  };
                  
                  await prisma.executionLog.update({
                    where: { id: executionLogId },
                    data: { currentNodeState: execution.currentNodeState }
                  });
                }
                
                return { success: true, output };
            } catch (error) {
              if (node.config?.autoRetry && !(error instanceof RateLimitExceeded)) {
                try {
                  console.log(`Retrying Action [${node.title}] due to autoRetry config...`);
                  if (node.config?.persistentFailure) throw new Error("Simulated Persistent Failure");
                  return { success: true, retried: true };
                } catch (retryError) {
                  return { success: false, error: retryError.message, retried: true };
                }
              }
              if (error instanceof RateLimitExceeded) {
                throw error; 
              }
              return { success: false, error: error.message };
            }
          });

          if (actionResult.success) {
            await step.run(`Log Action Success (Node ${node.id})`, async () => {
              await prisma.analyticsEvent.create({
                data: {
                  executionLogId,
                  eventType: actionResult.retried ? `NODE_ACTION_SUCCESS_RECOVERED` : `NODE_ACTION_SUCCESS`,
                  metadata: { nodeId: node.id, title: node.title, output: actionResult.output }
                }
              });
            });
          } else {
            hasFailedStep = true;
            await step.run(`Log Action Fail (Node ${node.id})`, async () => {
              await prisma.analyticsEvent.create({
                data: {
                  executionLogId,
                  eventType: `NODE_ACTION_FAIL`,
                  metadata: { nodeId: node.id, title: node.title, error: actionResult.error, retried: !!actionResult.retried }
                }
              });
            });
          }

          if (!hasFailedStep) {
            await executeNodeTree(node.id, null);
          }
        } else if (node.type === NODE_TYPES.REMINDER_SEQUENCE || node.integration?.id === 'reminder_sequence') {
           const branches = node.config?.branches || [];
           for (const branch of branches) {
              const bConfig = node.config[`branch_${branch.id}`] || {};
              const targetDateStr = bConfig.targetDate;
              
              if (targetDateStr) {
                const targetDate = await step.run(`Calculate Reminder Date (Branch ${branch.id} Node ${node.id})`, async () => {
                   let d = dayjs.tz(targetDateStr, bConfig.timezone || 'UTC');
                   if (!d.isValid()) d = dayjs();
                   return d.toISOString();
                });

                if (new Date(targetDate).getTime() > Date.now()) {
                  await step.run(`Set Waiting Status (Branch ${branch.id} Node ${node.id})`, async () => {
                    await prisma.executionLog.update({
                      where: { id: executionLogId },
                      data: { status: 'WAITING', currentNodeState: { ...(execution.currentNodeState || {}), step: 'DELAY', nodeId: node.id, title: node.title, branchId: branch.id } }
                    });
                  });

                  await step.waitForEvent(`Wait for Reminder ${branch.id} (Node ${node.id})`, {
                    event: `workflow.resume.${node.id}`,
                    timeout: new Date(targetDate),
                    match: 'data.executionLogId'
                  });

                  await step.run(`Set Active Status (Branch ${branch.id} Node ${node.id})`, async () => {
                    await prisma.executionLog.update({
                      where: { id: executionLogId },
                      data: { status: 'ACTIVE' }
                    });
                  });
                }
              }
              await executeNodeTree(node.id, branch.id);
           }
           await executeNodeTree(node.id, null);
        } else if (node.type === NODE_TYPES.CONDITION) {
            const evalResult = await step.run(`Evaluate Condition (Node ${node.id})`, async () => {
               let branches = (node.config?.branches && Array.isArray(node.config.branches) && node.config.branches.length > 0)
                  ? node.config.branches
                  : [
                      { id: 'A', label: 'Path A' },
                      { id: 'B', label: 'Path B' },
                      { id: 'C', label: 'Path C' },
                      { id: 'D', label: 'Path D' },
                      { id: 'E', label: 'Path E' }
                    ].filter(b => node.config?.[`path${b.id}Var`] || node.config?.[`path${b.id}Val`]);

               if (branches.length === 0) {
                 branches = [{ id: 'A', label: 'Path A' }];
               }

               for (const branch of branches) {
                   const varTmpl = node.config[`path${branch.id}Var`] || node.config[`path_${branch.id}_var`];
                   const op = node.config[`path${branch.id}Op`] || node.config[`path_${branch.id}_op`] || 'contains';
                   const valTmpl = node.config[`path${branch.id}Val`] || node.config[`path_${branch.id}_val`];
                   
                   if (!varTmpl && !valTmpl) continue;
                   
                   const actualVar = varTmpl ? resolveVars(varTmpl) : '';
                   
                   if (op === 'exists') {
                     if (actualVar !== undefined && actualVar !== null && actualVar !== '') return branch.id;
                     continue;
                   }
                   if (op === 'not_exists') {
                     if (actualVar === undefined || actualVar === null || actualVar === '') return branch.id;
                     continue;
                   }
                   
                   const valStr = valTmpl ? (resolveVars(valTmpl) || '') : '';
                   const isCaseSensitive = node.config[`path${branch.id}Case`] === true || node.config[`path_${branch.id}_case`] === true;
                   const possibleVals = String(valStr).split(',').map(s => s.trim());
                   const varString = String(actualVar);
                   
                   let matched = false;
                   for (const v of possibleVals) {
                      const andParts = v.split('&&').map(s => s.trim());
                      let allAndsMatch = true;
                      
                      for (const part of andParts) {
                         const p = isCaseSensitive ? part : part.toLowerCase();
                         const a = isCaseSensitive ? varString : varString.toLowerCase();
                         
                         let partMatched = false;
                         if (op === 'contains' && a.includes(p)) partMatched = true;
                         if (op === 'not_contains' && !a.includes(p)) partMatched = true;
                         if (op === 'equals' && a === p) partMatched = true;
                         if (op === 'not_equals' && a !== p) partMatched = true;
                         if (op === 'starts_with' && a.startsWith(p)) partMatched = true;
                         if (op === 'ends_with' && a.endsWith(p)) partMatched = true;
                         if (op === 'greater_than' && Number(actualVar) > Number(part)) partMatched = true;
                         if (op === 'less_than' && Number(actualVar) < Number(part)) partMatched = true;
                         
                         if (!partMatched) {
                            allAndsMatch = false;
                            break;
                         }
                      }
                      
                      if (allAndsMatch) {
                         matched = true;
                         break;
                      }
                   }
                   
                   if (matched) {
                      return branch.id;
                   }
               }
               return null;
            });
            
            if (evalResult) {
              await executeNodeTree(node.id, evalResult);
            } else {
              // Check if there is an ELSE branch or fallback
              await executeNodeTree(node.id, 'ELSE');
              await executeNodeTree(node.id, null);
            }
        } else {
           await executeNodeTree(node.id, null);
        }
      }
    };

    await executeNodeTree(null, null);

    // 3. Mark Workflow Completed or Partially Failed
    await step.run("Finalize Workflow", async () => {
      const finalStatus = hasFailedStep ? SYSTEM_STATUS.PARTIALLY_FAILED : SYSTEM_STATUS.COMPLETED;
      await prisma.executionLog.update({
        where: { id: executionLogId },
        data: { status: finalStatus },
      });
    });

    return { success: true, executionLogId, hasFailedStep };
  }
);

// 5-Day Storage Grace Period Auto-Purge Cron (Runs Daily at 2:00 AM UTC)
export const storageGracePurgeCron = inngest.createFunction(
  { 
    id: "storage-grace-purge-cron", 
    name: "5-Day Storage Grace Period Auto-Purge",
    triggers: { cron: "0 2 * * *" }
  },
  async ({ step }) => {
    const usersToPurge = await step.run("Find Expired Grace Period Users", async () => {
      const now = new Date();
      return await prisma.user.findMany({
        where: {
          storageStatus: "GRACE_PERIOD",
          storageGraceExpiresAt: { lte: now }
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          quotaTier: true,
          maxStorageMB: true,
          media: {
            orderBy: { createdAt: "desc" },
            select: { id: true, url: true, sizeMB: true }
          }
        }
      });
    });

    for (const user of usersToPurge) {
      await step.run(`Purge Excess Media for User ${user.id}`, async () => {
        const now = new Date();
        const isMainSubActive = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;
        const subTier = (user.subscriptionTier || 'starter').toLowerCase();

        let baseAllowedMB = 50;
        let newQuotaTier = "Free Plan (50 MB)";
        let newMaxImages = 10;
        let newMaxImageMB = 2;
        let newMaxVideos = 1;
        let newMaxVideoMB = 25;
        let newSubTier = user.subscriptionTier;
        let messageText = "";

        if (isMainSubActive && (subTier === 'professional' || subTier === 'pro')) {
          // Layer 1: User is an active Pro user -> revert storage to Pro base allowance (200MB)
          baseAllowedMB = 200;
          newQuotaTier = "Professional Base (200 MB)";
          newMaxImages = 30;
          newMaxImageMB = 5;
          newMaxVideos = 4;
          newMaxVideoMB = 35;
          messageText = `Your standalone storage add-on pack has expired. Your storage has reverted to your active Professional plan allowance (200 MB), and excess files were safely purged.`;
        } else if (isMainSubActive && subTier === 'enterprise') {
          // Layer 1: User is an active Enterprise user -> revert storage to Enterprise base allowance (500MB)
          baseAllowedMB = 500;
          newQuotaTier = "Enterprise Base (500 MB)";
          newMaxImages = 80;
          newMaxImageMB = 8;
          newMaxVideos = 8;
          newMaxVideoMB = 50;
          messageText = `Your standalone storage add-on pack has expired. Your storage has reverted to your active Enterprise plan allowance (500 MB), and excess files were safely purged.`;
        } else {
          // Layer 2: Main subscription expired -> revert user to Starter/Free (50MB, 3 flows, 100 executions)
          baseAllowedMB = 50;
          newQuotaTier = "Free Plan (50 MB)";
          newSubTier = "free";
          newMaxImages = 10;
          newMaxImageMB = 2;
          newMaxVideos = 1;
          newMaxVideoMB = 25;
          messageText = `Your subscription plan has expired without renewal. Your account has been downgraded to the Free Starter tier (50 MB storage, 3 workflows, 100 executions) and excess files were purged.`;
        }

        let currentStorage = user.media.reduce((sum, m) => sum + (m.sizeMB || 0), 0);

        // Delete newest files until storage is under the allowed base limit
        for (const file of user.media) {
          if (currentStorage <= baseAllowedMB) break;
          try {
            await del(file.url);
          } catch (e) {
            console.error(`Failed to delete blob for ${file.url}:`, e);
          }
          await prisma.media.delete({ where: { id: file.id } });
          currentStorage -= (file.sizeMB || 0);
        }

        // Update user limits and reset grace status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: newSubTier,
            storageStatus: "ACTIVE",
            quotaTier: newQuotaTier,
            maxStorageMB: baseAllowedMB,
            maxImages: newMaxImages,
            maxImageMB: newMaxImageMB,
            maxVideos: newMaxVideos,
            maxVideoMB: newMaxVideoMB,
            storagePlanExpiresAt: null,
            storageGraceExpiresAt: null
          }
        });

        // Create Notification & send email
        await prisma.notification.create({
          data: {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            userId: user.id,
            type: "STORAGE_PURGED",
            message: messageText,
            status: "UNREAD",
            updatedAt: new Date()
          }
        });

        if (user.email) {
          await sendMail({
            to: user.email,
            subject: "⚠️ Automatix: Storage Plan Downgraded & Excess Files Purged",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 8px; border: 1px solid #222;">
                <h2 style="color: #ef4444;">Storage Grace Period Expired</h2>
                <p>Hello ${user.name || 'there'},</p>
                <p>${messageText}</p>
                <p>Your active storage capacity is now <strong>${baseAllowedMB} MB</strong>.</p>
                <p>To upgrade your storage again and restore high limits, visit your billing dashboard anytime.</p>
                <a href="${process.env.NEXTAUTH_URL || 'https://automatix.agency'}/dashboard/billing" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Manage Storage & Billing</a>
              </div>
            `
          }).catch(console.error);
        }
      });
    }

    return { purgedCount: usersToPurge.length };
  }
);

// Multi-Stage Subscription & Storage Renewal Reminders (Runs Every 4 Hours)
export const subscriptionRenewalCron = inngest.createFunction(
  { 
    id: "subscription-renewal-cron", 
    name: "Multi-Stage Subscription & Storage Renewal Reminders",
    triggers: { cron: "0 */4 * * *" }
  },
  async ({ step }) => {
    const users = await step.run("Scan Users For Upcoming Renewals", async () => {
      const now = new Date();
      const in6Days = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

      return await prisma.user.findMany({
        where: {
          OR: [
            { subscriptionExpiresAt: { gte: now, lte: in6Days } },
            { storagePlanExpiresAt: { gte: now, lte: in6Days } },
            { subscriptionExpiresAt: { lt: now }, storageStatus: "ACTIVE" }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          storagePlanExpiresAt: true,
          quotaTier: true,
          autoPayEnabled: true,
          lastReminderStage: true,
          storageStatus: true
        }
      });
    });

    for (const user of users) {
      await step.run(`Process Reminders for ${user.id}`, async () => {
        const now = new Date();
        const subExpiry = user.subscriptionExpiresAt;
        const storageExpiry = user.storagePlanExpiresAt;
        const targetExpiry = (subExpiry && subExpiry > now) ? subExpiry : storageExpiry;

        // If subscription has expired and not in grace period yet -> move to GRACE_PERIOD
        if (subExpiry && subExpiry <= now && user.storageStatus === 'ACTIVE') {
          const graceExpires = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              storageStatus: "GRACE_PERIOD",
              storageGraceExpiresAt: graceExpires,
              lastReminderStage: "grace_start"
            }
          });

          await prisma.notification.create({
            data: {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              userId: user.id,
              type: "PAYMENT_OVERDUE",
              message: `⚠️ Your plan renewal payment is overdue! Your account is in a 5-day grace period. Excess files will be purged in 5 days if payment is not completed.`,
              status: "UNREAD",
              updatedAt: new Date()
            }
          });

          if (user.email) {
            await sendMail({
              to: user.email,
              subject: "⚠️ Action Required: Subscription Expired - 5 Days Grace Period Active",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 8px; border: 1px solid #333;">
                  <h2 style="color: #f59e0b;">Payment Overdue - 5-Day Grace Period</h2>
                  <p>Hello ${user.name || 'there'},</p>
                  <p>Your subscription for Automatix has expired without renewal.</p>
                  <p><strong>You have 5 days to renew your payment.</strong> If payment is not completed by <strong>${graceExpires.toLocaleDateString()}</strong>, your storage will be locked to the 50MB free tier and excess files will be permanently purged.</p>
                  <p>AutoPay Status: <strong>${user.autoPayEnabled ? 'AutoPay Enabled (Payment Pending/Failed)' : 'AutoPay Disabled - Manual Payment Needed'}</strong></p>
                  <a href="${process.env.NEXTAUTH_URL || 'https://automatix.agency'}/dashboard/billing" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Make Payment Now</a>
                </div>
              `
            }).catch(console.error);
          }
          return;
        }

        if (!targetExpiry) return;

        const diffHours = (targetExpiry.getTime() - now.getTime()) / (1000 * 60 * 60);
        let stage = null;
        let stageTitle = "";

        if (diffHours <= 12 && diffHours > 0) {
          stage = "12h";
          stageTitle = "Critical Notice: Plan Renews in 12 Hours";
        } else if (diffHours <= 24 && diffHours > 12) {
          stage = "1d";
          stageTitle = "Urgent: Plan Renews in 24 Hours";
        } else if (diffHours <= 72 && diffHours > 24) {
          stage = "3d";
          stageTitle = "Reminder: Plan Renews in 3 Days";
        } else if (diffHours <= 120 && diffHours > 72) {
          stage = "5d";
          stageTitle = "Upcoming Renewal: Plan Renews in 5 Days";
        }

        if (stage && user.lastReminderStage !== stage) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastReminderStage: stage }
          });

          await prisma.notification.create({
            data: {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              userId: user.id,
              type: "RENEWAL_REMINDER",
              message: `${stageTitle}. AutoPay is ${user.autoPayEnabled ? 'ACTIVE' : 'INACTIVE'}. Click here to review your billing.`,
              status: "UNREAD",
              updatedAt: new Date()
            }
          });

          if (user.email) {
            await sendMail({
              to: user.email,
              subject: `📅 ${stageTitle} - Automatix`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0a0a; color: #ffffff; border-radius: 8px; border: 1px solid #333;">
                  <h2 style="color: #3b82f6;">${stageTitle}</h2>
                  <p>Hello ${user.name || 'there'},</p>
                  <p>This is an automated notification regarding your upcoming service renewal on <strong>${targetExpiry.toLocaleDateString()}</strong>.</p>
                  <div style="background: #111; padding: 15px; border-radius: 6px; border: 1px solid #222; margin: 15px 0;">
                    <p style="margin: 5px 0;"><strong>Active Tier:</strong> ${user.subscriptionTier || 'Professional'}</p>
                    <p style="margin: 5px 0;"><strong>Storage Tier:</strong> ${user.quotaTier || '50 MB Free'}</p>
                    <p style="margin: 5px 0;"><strong>AutoPay Status:</strong> <span style="color: ${user.autoPayEnabled ? '#10b981' : '#f59e0b'}; font-weight: bold;">${user.autoPayEnabled ? 'ACTIVE (Will automatically process)' : 'INACTIVE (Action Required)'}</span></p>
                  </div>
                  <p>If AutoPay is inactive or if you wish to adjust your plan before renewal, please visit your billing dashboard.</p>
                  <a href="${process.env.NEXTAUTH_URL || 'https://automatix.agency'}/dashboard/billing" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Go to Billing & Invoices</a>
                </div>
              `
            }).catch(console.error);
          }
        }
      });
    }

    return { processedCount: users.length };
  }
);
