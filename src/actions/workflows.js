'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';
import { checkKeywordMatch } from '@/lib/keywordUtils';

export async function createWorkflow() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const workflow = await prisma.workflow.create({
    data: {
      name: 'New Automation',
      clientId: session.user.id,
      nodesJson: [],
      isActive: false,
    },
  });

  revalidatePath('/dashboard/workflows');
  redirect(`/workflows/${workflow.id}`);
}

export async function toggleWorkflowPublish(workflowId, isActive) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existing = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { clientId: true }
  });

  if (!existing || existing.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { isActive },
  });

  revalidatePath('/dashboard/workflows');
  revalidatePath('/dashboard');
  revalidatePath(`/workflows/${workflowId}`);
  
  return { success: true, isActive };
}

export async function pollWebhookStatus(workflowId, nodeId) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { clientId: true, nodesJson: true }
  });

  if (!workflow || workflow.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  let nodes = [];
  if (typeof workflow.nodesJson === 'string') {
    try {
      nodes = JSON.parse(workflow.nodesJson);
    } catch(e) {}
  } else if (Array.isArray(workflow.nodesJson)) {
    nodes = workflow.nodesJson;
  }

  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  return {
    isListening: node.config?.isListening || false,
    capturedPayload: node.config?.capturedPayload || null
  };
}

export async function getWebhookPayloadHistory(workflowId) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const logs = await prisma.executionLog.findMany({
    where: { 
      workflowId,
      // We only want logs where a trigger payload exists (which is all of them usually)
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      currentNodeState: true
    }
  });

  // Extract payload from currentNodeState
  return logs.map(log => {
    let payload = null;
    if (log.currentNodeState && typeof log.currentNodeState === 'object') {
      payload = log.currentNodeState.payload || null;
    }
    return {
      id: log.id,
      createdAt: log.createdAt,
      payload
    };
  }).filter(log => log.payload); // only return logs that have a payload
}

export async function updateWorkflow(workflowId, data) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existing = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { clientId: true }
  });

  if (!existing || existing.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  const updatedWorkflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.nodesJson !== undefined && { nodesJson: data.nodesJson }),
    },
  });

  // Automatically manage WORKFLOW_ISSUE notifications based on node validity
  if (data.nodesJson) {
    try {
      const nodes = typeof data.nodesJson === 'string' ? JSON.parse(data.nodesJson) : data.nodesJson;
      const trigger = nodes.find(n => n.type === 'TRIGGER' || n.type === 'trigger');
      
      const reachableSet = new Set();
      const traverse = (nodeId) => {
        if (!nodeId || reachableSet.has(nodeId)) return;
        reachableSet.add(nodeId);
        const children = nodes.filter(n => n.parentId === nodeId);
        for (const child of children) traverse(child.id);
      };
      if (trigger) traverse(trigger.id);
      
      let issues = [];

      if (!trigger || !trigger.integration) {
        issues.push({
          nodeId: trigger ? trigger.id : 'unknown',
          message: 'Trigger is missing configuration.'
        });
      } else if (trigger.issue) {
        issues.push({
          nodeId: trigger.id,
          message: 'Trigger has configuration issues.'
        });
      } else {
        const reqConn = ['webhook', 'calendar', 'instagram', 'sheets', 'slack', 'twilio', 'stripe', 'gmail', 'smtp', 'openai'];
        if (trigger.integration && reqConn.includes(trigger.integration.id)) {
          if (trigger.integration.id !== 'webhook' && !(trigger.integration.id === 'calendar' && trigger.config?.provider === 'builtin')) {
            if (!trigger.config?.connectionId) {
              issues.push({
                nodeId: trigger.id,
                message: 'Missing required connection.'
              });
            }
          }
        }
      }

      // If trigger is fine, check all other nodes
      if (issues.length === 0) {
        for (const node of nodes) {
          if (!reachableSet.has(node.id)) continue;
          if (node.id === trigger?.id) continue;
          
          if (node.issue) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || node.type}" has configuration issues.`
            });
            continue;
          }
          
          const id = node.integration?.id;
          const conf = node.config || {};

          // Comprehensive validation for all action nodes


          let isInternalInvalid = false;
          if (id === 'delay') {
            const dDuration = conf.duration !== undefined ? conf.duration : 1;
            const dUnit = conf.unit || 'minutes';
            isInternalInvalid = !(conf.delayType === 'event_based' ? (conf.eventDate && dDuration && dUnit) : (dDuration && dUnit));
          } else if (id === 'date_formatter') {
            const op = conf.operation || 'format_timezone';
            if (op === 'duration') isInternalInvalid = !conf.startDate || !conf.endDate;
            else isInternalInvalid = !conf.dateString;
          } else if (id === 'formatter_extract') {
            isInternalInvalid = !conf.inputString;
          } else if (id === 'formatter_dev') {
            isInternalInvalid = !conf.code;
          } else if (id === 'custom_variable') {
            if (!conf.varName) isInternalInvalid = true;
            else if (conf.varType === 'timestamp' && conf.useCurrentTime === false && !conf.varValue) isInternalInvalid = true;
            else if (conf.varType !== 'timestamp' && !conf.varValue) isInternalInvalid = true;
          } else if (id === 'http') {
            isInternalInvalid = !conf.url || !conf.method;
          } else if (id === 'calendar_status') {
            isInternalInvalid = !conf.bookingId;
          } else if (id === 'meta_capi') {
            isInternalInvalid = !conf.pixelId || !conf.eventName;
          }

          if (isInternalInvalid) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || node.type}" requires configuration.`
            });
            continue;
          }

          // Check required fields based on integration schema
          const requiredFields = node.integration?.fields?.filter(f => f.required) || [];
          let missingField = false;
          for (const field of requiredFields) {
            if (conf[field.name] === undefined || conf[field.name] === '') {
              missingField = true;
              break;
            }
          }
          if (missingField) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || node.type}" is missing required fields.`
            });
            continue;
          }

          // Connection validation for nodes that require it
          const reqConnIds = ['slack', 'twilio', 'stripe', 'gmail', 'email', 'smtp', 'openai', 'instagram', 'instagram_action', 'calendar'];
          if (reqConnIds.includes(id)) {
            if (id !== 'calendar' || conf.provider !== 'builtin') {
              if (!conf.connectionId) {
                issues.push({
                  nodeId: node.id,
                  message: `Step "${node.title || node.integration?.name || node.type}" is missing a required connection.`
                });
                continue;
              }
            }
          }
          
          if (id === 'slack' && (!conf.channel || !conf.message)) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || 'Slack'}" is missing channel or message.`
            });
            continue;
          }

          const configStr = JSON.stringify(node.config || {});
          const regex = new RegExp('\\\\{\\\\{([^}]+)\\\\}\\\\}', 'g');
          let match;
          while ((match = regex.exec(configStr)) !== null) {
            const varPath = match[1];
            if (varPath.startsWith('trigger.')) {
               if (!trigger || !trigger.integration || trigger.issue) {
                 issues.push({
                   nodeId: node.id,
                   message: `Step uses an invalid trigger variable.`
                 });
                 break;
               }
            }
            if (varPath.startsWith('steps.node-')) {
              const referencedNodeId = varPath.split('.')[1];
              const refNode = nodes.find(n => n.id === referencedNodeId);
              if (!refNode) {
                 issues.push({
                   nodeId: node.id,
                   message: `Step references a missing variable.`
                 });
                 break;
              }
            }
          }
        }
      }

      const activeIssues = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          type: 'WORKFLOW_ISSUE',
          status: { in: ['UNREAD', 'IGNORED'] },
        }
      });
      const existingWorkflowIssues = activeIssues.filter(n => n.metadata?.workflowId === workflowId);

      if (issues.length > 0) {
        // Create new notifications for issues that don't already exist
        for (const issue of issues) {
          const alreadyExists = existingWorkflowIssues.some(n => n.metadata?.nodeId === issue.nodeId);
          if (!alreadyExists) {
            await prisma.notification.create({
              data: {
                id: crypto.randomUUID(),
                userId: session.user.id,
                type: 'WORKFLOW_ISSUE',
                message: `Issue in workflow "${updatedWorkflow.name}": ${issue.message}`,
                metadata: { workflowId: workflowId, nodeId: issue.nodeId },
                status: 'UNREAD',
                updatedAt: new Date()
              }
            });
          }
        }
        
        // Resolve issues that no longer exist
        for (const existing of existingWorkflowIssues) {
          const stillExists = issues.some(i => i.nodeId === existing.metadata?.nodeId);
          if (!stillExists) {
            await prisma.notification.update({
              where: { id: existing.id },
              data: { status: 'RESOLVED' }
            });
          }
        }
      } else {
        // Resolve all active issue notifications for this workflow since it is now valid
        for (const issue of existingWorkflowIssues) {
          await prisma.notification.update({
            where: { id: issue.id },
            data: { status: 'RESOLVED' }
          });
        }
      }
    } catch (err) {
      console.error('Error processing workflow issues:', err);
    }
  }

  revalidatePath('/dashboard/workflows');
  return { success: true };
}

export async function deleteWorkflow(workflowId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existing = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { clientId: true }
  });

  if (!existing || existing.clientId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  await prisma.workflow.delete({
    where: { id: workflowId }
  });

  revalidatePath('/dashboard/workflows');
  return { success: true };
}

export async function adminDeleteWorkflow(workflowId) {
  const session = await auth();
  if (!session?.user?.role === 'ADMIN') throw new Error('Unauthorized');

  await prisma.workflow.delete({
    where: { id: workflowId }
  });

  revalidatePath('/admin/workflows');
  return { success: true };
}

export async function adminDeleteUser(userId) {
  const session = await auth();
  if (!session?.user?.role === 'ADMIN') throw new Error('Unauthorized');

  // Also delete all their workflows
  await prisma.workflow.deleteMany({
    where: { clientId: userId }
  });

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function getWorkflowExecutionHistory(filters = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { status, dateRange, workflowId } = filters;
  
  const where = {
    workflow: {
      clientId: session.user.id
    }
  };

  if (workflowId) {
    where.workflowId = workflowId;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (dateRange && dateRange.from) {
    where.createdAt = {
      ...where.createdAt,
      gte: new Date(dateRange.from)
    };
  }
  
  if (dateRange && dateRange.to) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(dateRange.to)
    };
  }

  // If the user provided filters, we remove the strict limit to fetch all matching results
  const hasFilters = workflowId || (status && status !== 'ALL') || (dateRange && dateRange.from);
  const take = hasFilters ? undefined : 100; // Default to last 100 if no filters

  const logs = await prisma.executionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      workflow: {
        select: { name: true }
      },
      analyticsEvents: {
        orderBy: { timestamp: 'asc' }
      }
    }
  });

  return logs;
}

export async function getWaitingLeads(workflowId, nodeId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, clientId: session.user.id }
  });
  if (!workflow) throw new Error('Workflow not found');

  const waitingLogs = await prisma.executionLog.findMany({
    where: {
      workflowId,
      status: 'WAITING',
      currentNodeState: {
        path: ['nodeId'],
        equals: nodeId
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return waitingLogs;
}

export async function getWaitingCounts(workflowId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, clientId: session.user.id }
  });
  if (!workflow) throw new Error('Workflow not found');

  const waitingLogs = await prisma.executionLog.findMany({
    where: {
      workflowId,
      status: 'WAITING',
    },
    select: {
      currentNodeState: true
    }
  });

  const counts = {};
  for (const log of waitingLogs) {
    const nodeId = log.currentNodeState?.nodeId;
    if (nodeId) {
      counts[nodeId] = (counts[nodeId] || 0) + 1;
    }
  }

  return counts;
}

export async function resumeWaitingLeads(executionLogIds) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify ownership
  const logs = await prisma.executionLog.findMany({
    where: {
      id: { in: executionLogIds },
      workflow: { clientId: session.user.id }
    }
  });

  if (logs.length === 0) return { success: true };

  const events = logs.map(log => ({
    name: 'workflow.resume',
    data: { executionLogId: log.id }
  }));

  await inngest.send(events);
  
  return { success: true, count: events.length };
}

export async function removeWaitingLeads(executionLogIds) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Verify ownership
  const logs = await prisma.executionLog.findMany({
    where: {
      id: { in: executionLogIds },
      workflow: { clientId: session.user.id }
    }
  });

  if (logs.length === 0) return { success: true };

  const idsToUpdate = logs.map(l => l.id);

  await prisma.executionLog.updateMany({
    where: { id: { in: idsToUpdate } },
    data: { status: 'FAILED' } // mark failed to remove from waiting
  });

  // Log the cancellation
  const analyticsEvents = idsToUpdate.map(id => ({
    executionLogId: id,
    eventType: 'WORKFLOW_HALTED',
    metadata: { reason: 'Manually removed from waiting queue' }
  }));

  await prisma.analyticsEvent.createMany({ data: analyticsEvents });
  
  return { success: true, count: idsToUpdate.length };
}

export async function simulateInstagramDM(workflowId, messageText, isReply = false) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, nodesJson: true }
  });

  if (!workflow) throw new Error('Workflow not found');

  const nodes = typeof workflow.nodesJson === 'string' ? JSON.parse(workflow.nodesJson) : workflow.nodesJson;
  const triggerNode = nodes.find(n => n.type === 'TRIGGER');
  
  if (!triggerNode) throw new Error('Trigger not found');

  const payload = {
    object: 'instagram',
    entry: [
      {
        time: Date.now(),
        id: '17841400000000000',
        messaging: [
          {
            sender: { id: '1234567890' },
            recipient: { id: '17841400000000000' },
            timestamp: Date.now(),
            message: {
              mid: `mid.${Date.now()}`,
              text: messageText
            }
          }
        ]
      }
    ]
  };

  const senderId = '1234567890';
  
  if (!isReply) {
    await clearSimulations(workflowId);
  }
  
  const waitingLogs = await prisma.executionLog.findMany({
    where: { workflowId: workflow.id, status: 'WAITING' },
    orderBy: { updatedAt: 'desc' }
  });
  
  const waitingLog = waitingLogs.find(log => {
    const p = log.currentNodeState?.payload;
    return p?.entry?.[0]?.messaging?.[0]?.sender?.id === senderId;
  });

  if (isReply && !waitingLog) {
    return { 
      success: true, 
      ignored: true, 
      message: 'No active simulation is waiting for a reply. Please start the workflow from the beginning.' 
    };
  }

  if (isReply && waitingLog) {
    const delayNodeId = waitingLog.currentNodeState?.nodeId;
    if (delayNodeId) {
      const delayNode = nodes.find(n => n.id === delayNodeId);
      if (delayNode?.parentId) {
        const parentNode = nodes.find(n => n.id === delayNode.parentId);
        const parentIntegrationId = parentNode?.integration?.id || parentNode?.integrationId;
        
        if (parentIntegrationId === 'instagram' || parentIntegrationId === 'instagram_action') {
          const msgType = parentNode.config?.messageType;
          if (msgType === 'quiz' || msgType === 'quick_replies') {
            const optionsStr = parentNode.config?.options || '';
            const validOptions = optionsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            
            if (validOptions.length > 0 && !validOptions.includes(messageText.trim().toLowerCase())) {
              return { 
                success: true, 
                ignored: true, 
                message: `Simulation blocked. Your reply must exactly match one of the expected options: ${optionsStr}` 
              };
            }
          }
        }
      }
    }

    await inngest.send({
      name: `workflow.resume.${delayNodeId || 'unknown'}`,
      data: {
        executionLogId: waitingLog.id,
        payload
      }
    });
    return { 
      success: true, 
      message: 'Resumed waiting workflow', 
      resumed: true, 
      nodeId: waitingLog.currentNodeState?.nodeId 
    };
  }

  const condition = triggerNode.config?.condition;
  const keywordConfig = triggerNode.config?.keyword || '';
  const caseSensitive = triggerNode.config?.caseSensitive === true;
  
  if (condition && condition !== 'any') {
    const isMatch = checkKeywordMatch(messageText, keywordConfig, condition, caseSensitive);
    if (!isMatch) {
      // User requested that mismatched simulate messages be completely ignored,
      // not stored in history, mirroring the webhook endpoint's behavior.
      return { success: true, ignored: true, message: 'Simulated message did not match trigger keyword condition' };
    }
  }

  const executionLog = await prisma.executionLog.create({
    data: {
      workflowId: workflow.id,
      status: 'ACTIVE',
      currentNodeState: { step: 'TRIGGER', payload }
    }
  });

  await inngest.send({
    name: 'engine/workflow.start',
    data: {
      executionLogId: executionLog.id,
    }
  });

  return { success: true };
}

export async function clearSimulations(workflowId) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  
  // Find all waiting logs for this workflow
  const waitingLogs = await prisma.executionLog.findMany({
    where: { workflowId, status: 'WAITING' },
    select: { id: true, currentNodeState: true }
  });
  
  // Filter only the ones that belong to our simulated user '1234567890'
  const simulatedLogIds = waitingLogs.filter(log => {
    const p = log.currentNodeState?.payload;
    return p?.entry?.[0]?.messaging?.[0]?.sender?.id === '1234567890';
  }).map(l => l.id);
  
  if (simulatedLogIds.length > 0) {
    await prisma.executionLog.updateMany({
      where: { id: { in: simulatedLogIds } },
      data: { status: 'FAILED' } // mark failed so they don't appear in waiting counts
    });
  }
  return { success: true };
}
