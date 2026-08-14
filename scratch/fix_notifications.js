const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const workflows = await prisma.workflow.findMany();
  let count = 0;
  for (const w of workflows) {
    let nodes = [];
    try {
      nodes = typeof w.nodesJson === 'string' ? JSON.parse(w.nodesJson) : w.nodesJson;
    } catch(e) {}
    if (!Array.isArray(nodes)) nodes = [];
    
    const trigger = nodes.find(n => n.type === 'TRIGGER' || n.type === 'trigger');
    let hasIssue = false;
    let issueNodeId = 'unknown';
    
    if (!trigger || !trigger.integration) {
      hasIssue = true;
    }
    
    if (hasIssue) {
      const active = await prisma.notification.findMany({
        where: { userId: w.clientId, type: 'WORKFLOW_ISSUE', status: 'UNREAD' }
      });
      const exists = active.find(n => n.metadata?.workflowId === w.id);
      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: w.clientId,
            type: 'WORKFLOW_ISSUE',
            message: 'Trigger is missing configuration.',
            metadata: { workflowId: w.id, nodeId: issueNodeId },
            status: 'UNREAD'
          }
        });
        count++;
      }
    }
  }
  console.log('Created ' + count + ' missing notifications');
}
run().catch(console.error).finally(() => prisma.$disconnect());
