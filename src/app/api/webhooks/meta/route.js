import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';
import { SYSTEM_STATUS } from '@/constants';
import { checkKeywordMatch } from '@/lib/keywordUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const verifyToken = process.env.AUTOMATIX_META_VERIFY_TOKEN || 'automatix_secure_meta_token_123';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta Webhook Verified Successfully');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body = {};
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (body.object !== 'page' && body.object !== 'instagram') {
      return NextResponse.json({ success: true, ignored: true, message: 'Not a page or instagram object' }, { status: 200 });
    }

    if (!body.entry || body.entry.length === 0) {
      return NextResponse.json({ success: true, ignored: true, message: 'Empty entry array' }, { status: 200 });
    }

    for (const entry of body.entry) {
      const pageId = entry.id; // This is the Page ID that received the event
      
      let messagingItems = [];
      if (entry.messaging) messagingItems = entry.messaging;
      if (entry.standby) messagingItems = [...messagingItems, ...entry.standby];
      if (entry.changes) {
         // handle instagram comments/mentions etc if needed later
      }

      for (const item of messagingItems) {
        const senderId = item.sender?.id;
        const messageText = item.message?.text || '';
        
        if (!senderId) continue;
        
        // Find the Integration associated with this Page ID
        // The setup API will save the pageId as `accountEmail` or `providerName` metadata.
        // Usually `accountEmail` is used for the identifier. Let's assume `accountEmail` = pageId for Meta integrations.
        const integration = await prisma.integration.findFirst({
          where: {
            providerName: { in: ['instagram', 'facebook'] },
            accountEmail: pageId
          }
        });

        if (!integration) {
           console.warn(`No integration found for Meta Page ID: ${pageId}`);
           continue; // Skip processing if we don't own this page
        }

        // Find all active workflows for this client that use this integration
        const activeWorkflows = await prisma.workflow.findMany({
          where: {
            clientId: integration.clientId,
            isActive: true
          }
        });

        for (const workflow of activeWorkflows) {
          let nodes = [];
          if (typeof workflow.nodesJson === 'string') {
            try { nodes = JSON.parse(workflow.nodesJson); } catch(e) {}
          } else if (Array.isArray(workflow.nodesJson)) {
            nodes = workflow.nodesJson;
          }

          // Check if this workflow has a Meta trigger node
          const triggerNode = nodes.find(n => 
             n.type === 'trigger_instagram' && 
             (n.integrationId === integration.id || n.integration?.id === integration.id)
          );

          if (!triggerNode) continue;

          // 1. Check if there's an actively WAITING execution for this user
          const waitingLogs = await prisma.executionLog.findMany({
            where: { workflowId: workflow.id, status: 'WAITING' },
            orderBy: { updatedAt: 'desc' }
          });
          
          const waitingLog = waitingLogs.find(log => {
            const payload = log.currentNodeState?.payload;
            const waitingEntry = payload?.entry?.[0];
            const waitingItem = waitingEntry?.messaging?.[0] || waitingEntry?.standby?.[0];
            return waitingItem?.sender?.id === senderId;
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
                       // Wrong answer to quiz, ignore it.
                       continue;
                     }
                   }
                 }
               }
             }

             // Resume waiting workflow
             await inngest.send({
               name: \`workflow.resume.\${delayNodeId || 'unknown'}\`,
               data: {
                 executionLogId: waitingLog.id,
                 payload: body
               }
             });
             continue; // Handled as resume, don't trigger new run
          }

          // 2. Not waiting. Check Trigger condition
          const condition = triggerNode.config?.condition;
          const keywordConfig = triggerNode.config?.keyword || '';
          const caseSensitive = triggerNode.config?.caseSensitive === true;
          
          if (condition && condition !== 'any') {
            const isMatch = checkKeywordMatch(messageText, keywordConfig, condition, caseSensitive);
            if (!isMatch) {
               continue; // Keyword condition not met
            }
          }

          // 3. Trigger new Workflow Run
          const executionLog = await prisma.executionLog.create({
            data: {
              workflowId: workflow.id,
              externalReferenceId: senderId,
              status: SYSTEM_STATUS.ACTIVE,
              currentNodeState: { step: 'TRIGGER', payload: body }
            }
          });

          await inngest.send({
            name: 'engine/workflow.start',
            data: {
              executionLogId: executionLog.id,
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Meta Central Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
