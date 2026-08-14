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
      workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { id: true, isActive: true, nodesJson: true }
      });
    } catch (e) {
      // Catch invalid UUID errors or other Prisma errors
      console.warn('Prisma findUnique error:', e.message);
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

    const webhookNode = nodes.find(n => n.integration?.id === 'webhook' || n.type === 'trigger_instagram' || (n.type === 'TRIGGER' && n.config?.webhookToken));
    
    if (!webhookNode || webhookNode.config?.webhookToken !== token) {
      return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
    }

    const triggerEvent = webhookNode.config?.triggerEvent || 'POST';
    if (webhookNode.integration?.id === 'webhook' && triggerEvent !== 'ALL' && triggerEvent !== method) {
      return NextResponse.json({ error: `Method ${method} not allowed for this webhook` }, { status: 405 });
    }

    const isListening = webhookNode.config?.isListening === true;

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

    // 2. Initialize Execution Log (Start of Run)
    const executionLog = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        externalReferenceId: externalReferenceId,
        status: SYSTEM_STATUS.ACTIVE,
        currentNodeState: { step: 'TRIGGER', payload: body }
      }
    });

    // 3. Trigger Vercel Workflow Engine
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
