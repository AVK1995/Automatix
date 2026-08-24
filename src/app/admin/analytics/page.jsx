import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import MetricCard from '@/components/MetricCard';
import DashboardAnalytics from '@/app/dashboard/DashboardAnalytics';
import DataTable from '@/components/DataTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Execute parallel queries
  const [
    totalWorkflows,
    activeRuns,
    cancelledRuns,
    allLogs,
    usages,
    integrationUsages
  ] = await Promise.all([
    prisma.workflow.count(),
    prisma.executionLog.count({ where: { status: 'ACTIVE' } }),
    prisma.executionLog.count({ where: { status: 'CANCELLED' } }),
    prisma.executionLog.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: { workflow: { select: { id: true, name: true } } }
    }),
    prisma.connectionUsage.groupBy({
      by: ['date'],
      _sum: { requestCount: true },
      orderBy: { date: 'desc' },
      take: 30
    }),
    prisma.connectionUsage.groupBy({
      by: ['integrationId'],
      _sum: { requestCount: true },
      orderBy: { _sum: { requestCount: 'desc' } },
      take: 10
    })
  ]);

  // Hydrate integration details
  const populatedIntegrations = await Promise.all(
    integrationUsages.map(async (u) => {
      const integration = await prisma.integration.findUnique({
        where: { id: u.integrationId },
        include: { client: true }
      });
      return {
        ...u,
        integration
      };
    })
  );

  const recentLogs = allLogs.slice(0, 10);

  const tableColumns = [
    { header: 'Log ID', accessor: (row) => row.id.substring(0, 8) + '...' },
    { 
      header: 'Workflow Name', 
      accessor: (row) => row.workflow ? (
        <Link href={`/admin/workflows/${row.workflow.id}`} className="font-medium text-foreground hover:text-accent-blue transition-colors block">
          {row.workflow.name}
        </Link>
      ) : 'Unknown'
    },
    { header: 'Ext. Reference', accessor: (row) => row.externalReferenceId || 'N/A' },
    { header: 'Status', accessor: (row) => row.status, isStatus: true },
    { header: 'Started At', accessor: (row) => new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) },
  ];

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Platform Analytics & Execution Metrics</h1>
        <p className="text-text-secondary text-sm">System-wide workflow runs, event throughput, and API connection consumption.</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Workflows" 
          value={totalWorkflows} 
          description="Configured across all tenants" 
        />
        <MetricCard 
          title="Active Executions" 
          value={activeRuns} 
          description="Currently executing or sleeping" 
        />
        <MetricCard 
          title="Kill Switch Aborts" 
          value={cancelledRuns} 
          description="Halted by cancellation webhooks" 
        />
      </div>

      {/* Interactive Charts */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        <DashboardAnalytics logs={allLogs} isAdmin={true} />
      </div>

      {/* API Connection Usage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-border-subtle p-6 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-4">Last 30 Days Daily Usage</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-white/5">
            {usages.length === 0 ? (
              <p className="text-xs text-text-secondary">No usage data recorded yet.</p>
            ) : (
              usages.map(u => (
                <div key={u.date.toISOString()} className="flex justify-between items-center py-2 text-xs">
                  <span className="text-text-secondary">{new Date(u.date).toLocaleDateString()}</span>
                  <span className="text-white font-mono font-semibold">{u._sum.requestCount} requests</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-border-subtle p-6 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-4">Top API Connections (All Time)</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-white/5">
            {populatedIntegrations.length === 0 ? (
              <p className="text-xs text-text-secondary">No connections usage recorded yet.</p>
            ) : (
              populatedIntegrations.map((u) => (
                <div key={u.integrationId} className="flex justify-between items-center py-2 text-xs">
                  <div>
                    <p className="text-white font-medium">{u.integration?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-text-tertiary">{u.integration?.client?.email || 'Unknown'}</p>
                  </div>
                  <span className="text-accent-blue font-mono font-semibold bg-accent-blue/10 px-2 py-1 rounded">
                    {u._sum.requestCount} reqs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Execution Logs</h2>
        <DataTable data={recentLogs} columns={tableColumns} />
      </div>
    </div>
  );
}
