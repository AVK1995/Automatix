import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { SYSTEM_STATUS, NODE_TYPES } from "@/constants";
import { checkAndLogUsage, RateLimitExceeded } from "@/actions/rateLimit";
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
    triggers: [{ event: "engine/workflow.start" }]
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
              const trackingId = node.config?.connectionId || node.integrationId || node.id;
              if (!['http', 'sheets', 'formatter_text', 'formatter_math', 'formatter_datetime', 'json_parser', 'custom_variable', 'date_formatter', 'code', 'delay', 'condition'].includes(trackingId)) {
                 const wfOwner = await prisma.user.findUnique({ where: { id: execution.workflow.clientId }});
                 await checkAndLogUsage(trackingId, wfOwner?.quotaTier || 'free');
              }

              console.log(`Executing Action [${node.title}]:`, node.config);
              if (node.config?.simulateFailure) throw new Error("Simulated Failure");
              
              let output = null;
              if (node.integrationId === 'custom_variable' || node.integration?.id === 'custom_variable') {
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
              } else if (node.integrationId === 'date_formatter' || node.integration?.id === 'date_formatter') {
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
              } else if (node.integrationId === 'instagram_action' || node.integration?.id === 'instagram_action') {
                 const { messageType, message, mediaUrl, questionType, options } = node.config || {};
                 
                 let finalMessageText = message || '';
                 if (messageType === 'quiz' && questionType === 'multiple_choice' && options) {
                   const opts = options.split(',').map(o => o.trim()).filter(Boolean);
                   if (opts.length > 0) {
                     finalMessageText += '\n\n' + opts.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
                   }
                 }
                 
                 output = {
                   recipientType: node.config?.recipientType,
                   recipient: node.config?.recipient,
                   messageType,
                   mediaUrl: messageType === 'media' ? mediaUrl : undefined,
                   sentText: finalMessageText
                 };
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
           await executeNodeTree(node.id, 'A');
           await executeNodeTree(node.id, null);
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
