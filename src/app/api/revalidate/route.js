import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getNodeConnectionStatus, isNodeConfigured } from '@/lib/nodeValidation';

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany();
    for (const w of workflows) {
      if (w.nodesJson) {
        const nodes = typeof w.nodesJson === 'string' ? JSON.parse(w.nodesJson) : w.nodesJson;
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
              message: 'Missing required connection.'
            });
          } else if (!isNodeConfigured(trigger)) {
            issues.push({
              nodeId: trigger.id,
              message: 'Trigger requires complete configuration.'
            });
          }
        }

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
            userId: w.clientId,
            type: 'WORKFLOW_ISSUE',
            status: { in: ['UNREAD', 'IGNORED'] },
          }
        });
        const existingWorkflowIssues = activeIssues.filter(n => n.metadata?.workflowId === w.id);

        if (issues.length > 0) {
          for (const issue of issues) {
            const alreadyExists = existingWorkflowIssues.some(n => n.metadata?.nodeId === issue.nodeId);
            if (!alreadyExists) {
              await prisma.notification.create({
                data: {
                  id: crypto.randomUUID(),
                  userId: w.clientId,
                  type: 'WORKFLOW_ISSUE',
                  message: `Issue in workflow "${w.name}": ${issue.message}`,
                  metadata: { workflowId: w.id, nodeId: issue.nodeId },
                  status: 'UNREAD',
                  updatedAt: new Date()
                }
              });
            }
          }
          
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
          for (const existing of existingWorkflowIssues) {
            await prisma.notification.update({
              where: { id: existing.id },
              data: { status: 'RESOLVED' }
            });
          }
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
