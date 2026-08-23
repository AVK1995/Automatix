import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { SYSTEM_STATUS, NODE_TYPES } from "@/constants";
import { checkAndLogUsage, RateLimitExceeded } from "@/actions/rateLimit";
import nodemailer from 'nodemailer';
import { GoogleAuth } from 'google-auth-library';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

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
          const keyPath = path.replace('trigger.body.', '').replace(/\[/g, '.').replace(/\]/g, '');
          let current = execution.currentNodeState?.payload;
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
                else if (node.integrationId === 'sheets' || node.integration?.id === 'sheets') {
                  const spreadsheetId = resolveVars(node.config?.spreadsheetId || '');
                  const sheetName = resolveVars(node.config?.sheetName || 'Sheet1');
                  const rowData = node.config?.rowValues ? resolveVars(JSON.stringify(node.config.rowValues)) : '[]';

                  const auth = new GoogleAuth({
                    credentials: {
                      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    },
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                  });
                  const client = await auth.getClient();
                  const accessToken = (await client.getAccessToken()).token;

                  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`;
                  const sheetRes = await fetch(appendUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      values: [JSON.parse(rowData)]
                    })
                  });
                  output = await sheetRes.json();
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
                      const mediaPayload = {
                        recipient: { id: recipientId },
                        message: { attachment: { type: "image", payload: { url: mUrl } } }
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
