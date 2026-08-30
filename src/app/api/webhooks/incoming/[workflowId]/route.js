import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';
import { SYSTEM_STATUS } from '@/constants';
import { verifyMetaSignature, verifyCalendlySignature } from '@/lib/verifyWebhook';
import { checkKeywordMatch } from '@/lib/keywordUtils';

export const dynamic = 'force-dynamic';

async function handleRequest(request, { params }, method) {
  try {
    const { workflowId } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing webhook token' }, { status: 401 });
    }
    let rawBody = '';
    if (method !== 'GET') {
      try {
        rawBody = await request.text();
      } catch (e) {
        console.warn('Could not read request body', e);
      }
    }
    
    const headers = Object.fromEntries(request.headers);

    let body = {};
    if (method !== 'GET') {
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    } else {
      body = Object.fromEntries(url.searchParams.entries());
    }

    // Signature Verification
    if (headers['x-hub-signature-256']) {
      if (!verifyMetaSignature(rawBody, headers['x-hub-signature-256'])) {
        // Log the failure to DB so the user can see it in the UI!
        try {
          await prisma.executionLog.create({
            data: {
              workflowId,
              status: 'ERROR',
              currentNodeState: { step: 'TRIGGER', payload: body, error: 'Invalid Meta Signature' }
            }
          });
        } catch (e) {}
        return NextResponse.json({ error: 'Invalid Meta Signature' }, { status: 401 });
      }
    } else if (headers['calendly-webhook-signature']) {
      if (!verifyCalendlySignature(rawBody, headers['calendly-webhook-signature'])) {
        return NextResponse.json({ error: 'Invalid Calendly Signature' }, { status: 401 });
      }
    }

    // Meta Webhook Verification Handshake
    if (method === 'GET' && body['hub.mode'] === 'subscribe' && body['hub.challenge']) {
      // We will verify the token later in the logic.
      // For now, if this is a subscribe request, we MUST return the raw challenge.
    }
    
    // Extract an external reference ID if one exists (e.g., from Calendly or Meta)
    // This is crucial for the Pre-Flight Guard (Kill Switch)
    const externalReferenceId = body.external_reference_id || body.invitee_uuid || null;

    // 1. Verify Workflow Exists and is Active
    let workflow;
    try {
      if (workflowId && workflowId !== 'new') {
        workflow = await prisma.workflow.findUnique({
          where: { id: workflowId },
          select: { id: true, isActive: true, nodesJson: true }
        });
      }
    } catch (e) {
      console.warn('Prisma findUnique error:', e.message);
    }

    // Fallback: If workflow not found by ID or ID is 'new', find by webhook token in nodesJson
    if (!workflow && token) {
      try {
        const matchingWorkflows = await prisma.workflow.findMany({
          where: {
            nodesJson: { contains: token }
          },
          select: { id: true, isActive: true, nodesJson: true }
        });
        if (matchingWorkflows.length > 0) {
          workflow = matchingWorkflows[0];
        }
      } catch (e) {
        console.warn('Fallback token search error:', e.message);
      }
    }

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    let nodes = [];
    if (typeof workflow.nodesJson === 'string') {
      try {
        const parsed = JSON.parse(workflow.nodesJson);
        if (Array.isArray(parsed)) nodes = parsed;
      } catch(e) {}
    } else if (Array.isArray(workflow.nodesJson)) {
      nodes = workflow.nodesJson;
    }

    const webhookNode = nodes.find(n => 
      (n.config?.webhookToken === token) ||
      n.integration?.id === 'webhook' || 
      n.integration?.id === 'sheets_trigger' ||
      n.integration?.id === 'storage_trigger' ||
      n.type === 'trigger_instagram' || 
      (n.type === 'TRIGGER' && n.config?.webhookToken)
    );
    
    if (!webhookNode || webhookNode.config?.webhookToken !== token) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    const triggerEvent = webhookNode.config?.triggerEvent || 'POST';
    if (webhookNode.integration?.id === 'webhook' && triggerEvent !== 'ALL' && triggerEvent !== method) {
      return NextResponse.json({ error: `Method ${method} not allowed for this webhook` }, { status: 405 });
    }

    const isListening = webhookNode.config?.isListening !== false;

    if (!workflow.isActive && !isListening) {
      return NextResponse.json({ error: 'Workflow is currently inactive and not listening' }, { status: 400 });
    }

    // Handle Meta's GET verification handshake now that we've validated the token
    if (method === 'GET' && body['hub.mode'] === 'subscribe' && body['hub.challenge']) {
      return new NextResponse(body['hub.challenge'], { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Keyword Trigger Condition Evaluation (for Instagram) & Resumption Logic
    if (webhookNode.integration?.id === 'instagram' || webhookNode.type === 'trigger_instagram') {
      let senderId = null;
      let messageText = '';
      
      let messagingItem = null;
      if (body?.entry?.[0]) {
        const entry = body.entry[0];
        if (entry.messaging && entry.messaging.length > 0) {
          messagingItem = entry.messaging[0];
        } else if (entry.standby && entry.standby.length > 0) {
          messagingItem = entry.standby[0];
        }
      }

      if (messagingItem) {
        senderId = messagingItem.sender?.id;
        messageText = messagingItem.message?.text || '';
      }

      // 1. Check if this user has an active workflow WAITING for a reply
      if (senderId) {
        const waitingLogs = await prisma.executionLog.findMany({
          where: { workflowId: workflow.id, status: 'WAITING' },
          orderBy: { updatedAt: 'desc' }
        });
        
        const waitingLog = waitingLogs.find(log => {
          const payload = log.currentNodeState?.payload;
          const entry = payload?.entry?.[0];
          const item = entry?.messaging?.[0] || entry?.standby?.[0];
          return item?.sender?.id === senderId;
        });

        if (waitingLog) {
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
                    if (isListening) {
                       await prisma.executionLog.create({
                         data: {
                           workflowId: workflow.id,
                           externalReferenceId: externalReferenceId,
                           status: 'IGNORED',
                           currentNodeState: { step: 'TRIGGER', payload: body, ignoredReason: 'Quiz option mismatch' }
                         }
                       });
                    }
                    return NextResponse.json({ success: true, ignored: true, message: 'Message did not match expected quiz options' }, { status: 200 });
                  }
                }
              }
            }
          }

          // This is a reply to an actively waiting workflow! Resume it.
          await inngest.send({
            name: `workflow.resume.${delayNodeId || 'unknown'}`,
            data: {
              executionLogId: waitingLog.id,
              payload: body
            }
          });
          return NextResponse.json({ success: true, executionLogId: waitingLog.id, message: 'Resumed waiting workflow' }, { status: 200 });
        }
      }
      
      // 2. If not waiting, evaluate Trigger Condition
      const condition = webhookNode.config?.condition;
      const keywordConfig = webhookNode.config?.keyword || '';
      const caseSensitive = webhookNode.config?.caseSensitive === true;
      
      if (condition && condition !== 'any') {
        const isMatch = checkKeywordMatch(messageText, keywordConfig, condition, caseSensitive);
        if (!isMatch) {
          if (isListening) {
             await prisma.executionLog.create({
               data: {
                 workflowId: workflow.id,
                 externalReferenceId: externalReferenceId,
                 status: 'IGNORED',
                 currentNodeState: { step: 'TRIGGER', payload: body, ignoredReason: 'Keyword mismatch' }
               }
             });
          }
          // Condition not met. Ignore this webhook.
          return NextResponse.json({ success: true, ignored: true, message: 'Message did not match trigger keyword condition' }, { status: 200 });
        }
      }
    }

    // 2. Storage Bucket Allocation & Quota Enforcement (for storage_trigger or webhook media)
    let storageQuotaError = null;
    let lockedMediaRecord = null;
    const isMediaTrigger = webhookNode && (webhookNode.integration?.id === 'storage_trigger' || webhookNode.integrationId === 'storage_trigger' || (body.fileUrl || body.downloadUrl || body.name));

    if (isMediaTrigger && workflow.clientId) {
      try {
        const rawFileName = body.fileName || body.name || 'Uploaded Media';
        const remoteUrl = body.fileUrl || body.downloadUrl || '';
        const driveMatch = remoteUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([\w-]+)/i);
        const driveId = driveMatch ? driveMatch[1] : '';

        let fileSizeMB = 1.0;
        if (body.fileSizeMB) {
          fileSizeMB = parseFloat(body.fileSizeMB);
        } else if (body.size) {
          fileSizeMB = parseFloat((Number(body.size) / (1024 * 1024)).toFixed(2));
        }

        const isDoc = !!rawFileName.match(/\.(pdf|csv|xlsx|xls|docx|doc|pptx|ppt|txt)$/i);
        const isVideo = !isDoc && (body.fileType?.startsWith('video/') || !!rawFileName.match(/\.(mp4|mov|webm|m4v|mkv)$/i));
        const mediaType = isDoc ? 'DOCUMENT' : isVideo ? 'VIDEO' : 'IMAGE';

        // 25 MB max capacity limit per input file per trigger
        if (fileSizeMB > 25) {
          storageQuotaError = `File Size Exceeded: Media file (${fileSizeMB.toFixed(1)} MB) exceeds maximum allowed trigger input limit of 25.0 MB.`;
        }

        // Check User Storage Quota Capacity
        const user = await prisma.user.findUnique({
          where: { id: workflow.clientId },
          select: { maxStorageMB: true }
        });

        const lockedNodeId = `wf_trigger_${workflow.id}_${webhookNode?.id || 'trigger'}`;

        if (user && !storageQuotaError) {
          const userMedia = await prisma.media.findMany({
            where: { userId: workflow.clientId }
          });

          // Exclude this workflow's existing locked trigger file (since it updates the slot in-place)
          const otherMedia = userMedia.filter(m => m.nodeId !== lockedNodeId);
          const currentUsedMB = otherMedia.reduce((sum, m) => sum + (m.sizeMB || 0), 0);
          const remainingStorageMB = Math.max(0, (user.maxStorageMB || 50) - currentUsedMB);

          if (fileSizeMB > remainingStorageMB) {
            storageQuotaError = `Storage Bucket Full: File (${fileSizeMB.toFixed(1)} MB) exceeds your remaining storage capacity (${remainingStorageMB.toFixed(1)} MB of ${(user.maxStorageMB || 50)} MB). Please free up storage or upgrade your quota to resume automation.`;
          }
        }

        if (!storageQuotaError) {
          const streamUrl = driveId
            ? `/api/media/raw?id=${driveId}&filename=${encodeURIComponent(rawFileName)}`
            : (remoteUrl.startsWith('http') ? `/api/media/raw?url=${encodeURIComponent(remoteUrl)}&filename=${encodeURIComponent(rawFileName)}` : remoteUrl);

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
      } catch (e) {
        console.warn('Storage bucket allocation error:', e.message);
      }
    }

    // 3. Initialize Execution Log (Start of Run)
    const triggerPayload = {
      ...body,
      ...(storageQuotaError ? { storageQuotaError } : {}),
      ...(lockedMediaRecord ? { storageMediaId: lockedMediaRecord.id, isStorageLocked: true } : {})
    };

    const executionLog = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        externalReferenceId: externalReferenceId,
        status: storageQuotaError ? 'FAILED' : SYSTEM_STATUS.ACTIVE,
        currentNodeState: { step: 'TRIGGER', payload: triggerPayload, ...(storageQuotaError ? { error: storageQuotaError } : {}) }
      }
    });

    // Cache latest trigger payload to the node config for immediate builder & UI availability
    if (webhookNode && (webhookNode.integration?.id === 'storage_trigger' || webhookNode.integration?.id === 'sheets_trigger' || webhookNode.integration?.id === 'webhook')) {
      try {
        const rawFileName = body.fileName || body.name || 'Uploaded File';
        const remoteUrl = body.fileUrl || body.downloadUrl || '';
        const driveMatch = remoteUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([\w-]+)/i);
        const driveId = driveMatch ? driveMatch[1] : '';
        const streamUrl = driveId
          ? `/api/media/raw?id=${driveId}&filename=${encodeURIComponent(rawFileName)}`
          : (remoteUrl.startsWith('http') ? `/api/media/raw?url=${encodeURIComponent(remoteUrl)}&filename=${encodeURIComponent(rawFileName)}` : remoteUrl);

        const updatedNodes = nodes.map(n => {
          if (n.id === webhookNode.id) {
            return {
              ...n,
              config: {
                ...n.config,
                capturedPayload: triggerPayload,
                storageQuotaError: storageQuotaError || null,
                latestUploadedFile: (body.fileUrl || body.downloadUrl || body.name) ? {
                  fileName: rawFileName,
                  fileUrl: streamUrl,
                  fileType: body.fileType || body.mimeType || 'video/mp4',
                  fileSizeMB: body.fileSizeMB || (body.size ? (Number(body.size)/(1024*1024)).toFixed(2) : '1.0'),
                  folderName: n.config?.folderName || 'Automatix Uploads',
                  storageMediaId: lockedMediaRecord?.id || null,
                  isStorageLocked: !!lockedMediaRecord,
                  storageQuotaError: storageQuotaError || null,
                  capturedAt: new Date().toISOString()
                } : n.config?.latestUploadedFile
              }
            };
          }
          return n;
        });

        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { nodesJson: JSON.stringify(updatedNodes) }
        });
      } catch (e) {
        console.warn('Could not cache capturedPayload to workflow node:', e.message);
      }
    }

    if (storageQuotaError) {
      return NextResponse.json({
        success: false,
        error: storageQuotaError,
        executionLogId: executionLog.id
      }, { status: 400 });
    }

    // 4. Trigger Inngest Workflow Engine
    await inngest.send({
      name: 'engine/workflow.start',
      data: {
        executionLogId: executionLog.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      executionLogId: executionLog.id,
      message: 'Workflow execution started'
    }, { status: 200 });

  } catch (error) {
    console.error('Incoming Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(request, context) {
  return handleRequest(request, context, 'GET');
}

export async function POST(request, context) {
  return handleRequest(request, context, 'POST');
}
