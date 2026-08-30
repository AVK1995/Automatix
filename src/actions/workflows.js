'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';
import { checkKeywordMatch } from '@/lib/keywordUtils';
import { getNodeConnectionStatus, isNodeConfigured } from '@/lib/nodeValidation';

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
        const { needsConnection, isConnected } = getNodeConnectionStatus(trigger);
        if (needsConnection && !isConnected) {
          issues.push({
            nodeId: trigger.id,
            message: 'Missing required connection for trigger.'
          });
        } else if (!isNodeConfigured(trigger)) {
          issues.push({
            nodeId: trigger.id,
            message: 'Trigger requires complete configuration.'
          });
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
          
          const { needsConnection, isConnected } = getNodeConnectionStatus(node);
          if (needsConnection && !isConnected) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || node.integration?.name || node.type}" is missing a required connection.`
            });
            continue;
          }

          if (!isNodeConfigured(node)) {
            issues.push({
              nodeId: node.id,
              message: `Step "${node.title || node.integration?.name || node.type}" requires complete configuration.`
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

  // Strict 90-Day Retention Ceiling (Enforced across all queries)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Background auto-prune of logs older than 90 days
  prisma.executionLog.deleteMany({
    where: {
      workflow: { clientId: session.user.id },
      createdAt: { lt: ninetyDaysAgo }
    }
  }).catch(() => {});

  let fromDate = ninetyDaysAgo;
  if (dateRange && dateRange.from) {
    const customFrom = new Date(dateRange.from);
    if (customFrom > ninetyDaysAgo) {
      fromDate = customFrom;
    }
  }

  where.createdAt = {
    gte: fromDate
  };
  
  if (dateRange && dateRange.to) {
    where.createdAt.lte = new Date(dateRange.to);
  }

  // If the user provided filters, fetch matching up to 200, else default to last 100
  const take = 200;

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

export async function simulateStorageUpload(workflowId, fileData = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, clientId: true, nodesJson: true }
  });

  if (!workflow) throw new Error('Workflow not found');

  const rawFileName = fileData.fileName || 'sample_upload.mp4';
  const remoteUrl = fileData.fileUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop';
  const driveMatch = remoteUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([\w-]+)/i);
  const driveId = driveMatch ? driveMatch[1] : '';
  const streamUrl = driveId
    ? `/api/media/raw?id=${driveId}&filename=${encodeURIComponent(rawFileName)}`
    : (remoteUrl.startsWith('http') ? `/api/media/raw?url=${encodeURIComponent(remoteUrl)}&filename=${encodeURIComponent(rawFileName)}` : remoteUrl);

  const fileSizeMB = Number(fileData.fileSizeMB || 14.2);
  const isDoc = !!rawFileName.match(/\.(pdf|csv|xlsx|xls|docx|doc|pptx|ppt|txt)$/i);
  const isVideo = !isDoc && (fileData.fileType?.startsWith('video/') || !!rawFileName.match(/\.(mp4|mov|webm|m4v|mkv)$/i));
  const mediaType = isDoc ? 'DOCUMENT' : isVideo ? 'VIDEO' : 'IMAGE';

  let storageQuotaError = null;
  if (fileSizeMB > 25) {
    storageQuotaError = `File Size Exceeded: Media file (${fileSizeMB.toFixed(1)} MB) exceeds maximum allowed trigger input limit of 25.0 MB.`;
  }

  // Check user storage quota
  const user = await prisma.user.findUnique({
    where: { id: workflow.clientId },
    select: { maxStorageMB: true }
  });

  let nodes = [];
  try {
    nodes = typeof workflow.nodesJson === 'string' ? JSON.parse(workflow.nodesJson) : (workflow.nodesJson || []);
  } catch (e) {}
  const triggerNode = nodes.find(n => n.type === 'TRIGGER' || n.type === 'trigger' || n.integration?.id === 'storage_trigger');
  const lockedNodeId = `wf_trigger_${workflow.id}_${triggerNode?.id || 'trigger'}`;

  let lockedMediaRecord = null;
  if (user && !storageQuotaError) {
    const userMedia = await prisma.media.findMany({ where: { userId: workflow.clientId } });
    const otherMedia = userMedia.filter(m => m.nodeId !== lockedNodeId);
    const currentUsedMB = otherMedia.reduce((sum, m) => sum + (m.sizeMB || 0), 0);
    const remainingStorageMB = Math.max(0, (user.maxStorageMB || 50) - currentUsedMB);

    if (fileSizeMB > remainingStorageMB) {
      storageQuotaError = `Storage Bucket Full: File (${fileSizeMB.toFixed(1)} MB) exceeds your remaining storage capacity (${remainingStorageMB.toFixed(1)} MB of ${(user.maxStorageMB || 50)} MB). Please free up storage or upgrade your quota to resume automation.`;
    }
  }

  if (!storageQuotaError) {
    const existingMedia = await prisma.media.findFirst({
      where: { userId: workflow.clientId, nodeId: lockedNodeId }
    });

    if (existingMedia) {
      lockedMediaRecord = await prisma.media.update({
        where: { id: existingMedia.id },
        data: {
          fileName: rawFileName,
          url: streamUrl,
          sizeMB: fileSizeMB,
          type: mediaType,
          createdAt: new Date()
        }
      });
    } else {
      lockedMediaRecord = await prisma.media.create({
        data: {
          userId: workflow.clientId,
          nodeId: lockedNodeId,
          fileName: rawFileName,
          url: streamUrl,
          sizeMB: fileSizeMB,
          type: mediaType
        }
      });
    }
  }

  const payload = {
    fileName: rawFileName,
    fileUrl: streamUrl,
    fileType: fileData.fileType || (isVideo ? 'video/mp4' : isDoc ? 'application/pdf' : 'image/jpeg'),
    fileSizeMB,
    folderName: fileData.folderName || 'Automatix Uploads',
    storageMediaId: lockedMediaRecord?.id || null,
    isStorageLocked: !!lockedMediaRecord,
    storageQuotaError: storageQuotaError || null,
    uploadedAt: new Date().toISOString()
  };

  // Update nodesJson cache
  if (triggerNode) {
    const updatedNodes = nodes.map(n => {
      if (n.id === triggerNode.id) {
        return {
          ...n,
          config: {
            ...n.config,
            capturedPayload: payload,
            storageQuotaError: storageQuotaError || null,
            latestUploadedFile: {
              ...payload,
              capturedAt: new Date().toISOString()
            }
          }
        };
      }
      return n;
    });

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { nodesJson: JSON.stringify(updatedNodes) }
    });
  }

  const executionLog = await prisma.executionLog.create({
    data: {
      workflowId: workflow.id,
      status: storageQuotaError ? 'FAILED' : 'ACTIVE',
      currentNodeState: { step: 'TRIGGER', payload, ...(storageQuotaError ? { error: storageQuotaError } : {}) }
    }
  });

  if (storageQuotaError) {
    return { success: false, error: storageQuotaError, payload };
  }

  try {
    await inngest.send({
      name: 'engine/workflow.start',
      data: {
        executionLogId: executionLog.id,
      }
    });
  } catch (e) {
    console.warn('Inngest start warning:', e.message);
  }

  return { success: true, payload };
}

