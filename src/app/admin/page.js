import { prisma } from '@/lib/prisma';
import MetricCard from '@/components/MetricCard';
import DataTable from '@/components/DataTable';

// Disable caching for the admin dashboard to always show live stats
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Execute parallel aggregation queries against Neon/PgBouncer
  const [
    totalWorkflows,
    activeRuns,
    cancelledRuns,
    recentLogs
  ] = await Promise.all([
    prisma.workflow.count(),
    prisma.executionLog.count({ where: { status: 'ACTIVE' } }),
    prisma.executionLog.count({ where: { status: 'CANCELLED' } }),
    prisma.executionLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { workflow: { select: { name: true } } }
    })
  ]);

  const tableColumns = [
    { header: 'Log ID', accessor: (row) => row.id.substring(0, 8) + '...' },
    { header: 'Workflow Name', accessor: (row) => row.workflow?.name || 'Unknown' },
    { header: 'Ext. Reference', accessor: (row) => row.externalReferenceId || 'N/A' },
    { header: 'Status', accessor: (row) => row.status, isStatus: true },
    { header: 'Started At', accessor: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Workflows" 
          value={totalWorkflows} 
          description="Across all tenants" 
        />
        <MetricCard 
          title="Active Executions" 
          value={activeRuns} 
          description="Currently processing or sleeping" 
        />
        <MetricCard 
          title="Kill Switch Aborts" 
          value={cancelledRuns} 
          description="Runs halted by cancellation webhooks" 
        />
      </div>

      {/* Recent Activity Table */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Execution Logs</h2>
        <DataTable data={recentLogs} columns={tableColumns} />
      </div>
    </div>
  );
}
