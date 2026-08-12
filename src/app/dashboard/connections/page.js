import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ConnectionsClient from './ConnectionsClient';

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const session = await auth();

  const connections = await prisma.integration.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  const workflows = await prisma.workflow.findMany({
    where: { clientId: session.user.id }
  });

  const connectionUsage = {};
  const pseudoConnectionsMap = {};

  workflows.forEach(wf => {
    let nodes = [];
    try {
      nodes = typeof wf.nodesJson === 'string' ? JSON.parse(wf.nodesJson) : (wf.nodesJson || []);
    } catch (e) {}

    nodes.forEach(node => {
      // 1. Map standard connections
      if (node.config?.connectionId) {
        if (!connectionUsage[node.config.connectionId]) connectionUsage[node.config.connectionId] = [];
        connectionUsage[node.config.connectionId].push({
          workflowId: wf.id,
          workflowName: wf.name || 'Untitled Workflow',
          nodeId: node.id,
          nodeTitle: node.title || 'Step'
        });
      }

      // 2. Map Google Sheets as pseudo-connections
      if (node.integration?.id === 'sheets' && node.config?.spreadsheetId) {
        const pId = `sheets-${node.config.spreadsheetId}`;
        if (!pseudoConnectionsMap[pId]) {
          pseudoConnectionsMap[pId] = {
            id: pId,
            provider: 'google-sheets-pseudo',
            name: node.config.spreadsheetName || 'Unknown Sheet',
            createdAt: wf.updatedAt,
            isPseudo: true,
            spreadsheetId: node.config.spreadsheetId
          };
          connectionUsage[pId] = [];
        }
        // Update name if we found a better one
        if (node.config.spreadsheetName && pseudoConnectionsMap[pId].name === 'Unknown Sheet') {
          pseudoConnectionsMap[pId].name = node.config.spreadsheetName;
        }
        connectionUsage[pId].push({
          workflowId: wf.id,
          workflowName: wf.name || 'Untitled Workflow',
          nodeId: node.id,
          nodeTitle: node.title || 'Step'
        });
      }
    });
  });

  // Fetch execution log stats
  const executionStatsRaw = await prisma.executionLog.groupBy({
    by: ['workflowId', 'status'],
    _count: {
      id: true
    }
  });

  const workflowStats = {};
  executionStatsRaw.forEach(stat => {
    if (!workflowStats[stat.workflowId]) {
      workflowStats[stat.workflowId] = { total: 0, failed: 0 };
    }
    workflowStats[stat.workflowId].total += stat._count.id;
    if (stat.status === 'FAILED' || stat.status === 'PARTIALLY_FAILED') {
      workflowStats[stat.workflowId].failed += stat._count.id;
    }
  });

  const allConnections = [...connections, ...Object.values(pseudoConnectionsMap)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-foreground mb-1">Integrations & Connections</h1>
        <p className="text-sm text-text-secondary">Connect your favorite tools to Automatix to use them in your workflows.</p>
      </div>

      <ConnectionsClient 
        initialConnections={allConnections} 
        usageMap={connectionUsage} 
        workflowStats={workflowStats} 
      />
    </div>
  );
}
