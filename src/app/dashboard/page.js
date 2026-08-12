import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import MetricCard from '@/components/MetricCard';
import Link from 'next/link';
import DashboardAnalytics from './DashboardAnalytics';

export const dynamic = 'force-dynamic';

export default async function ClientOverview() {
  const session = await auth();
  
  const [
    totalWorkflows,
    activeRuns,
    allLogs
  ] = await Promise.all([
    prisma.workflow.count({ where: { clientId: session.user.id } }),
    prisma.executionLog.count({ 
      where: { 
        workflow: { clientId: session.user.id },
        status: 'ACTIVE' 
      } 
    }),
    prisma.executionLog.findMany({
      where: { workflow: { clientId: session.user.id } },
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: { workflow: { select: { id: true, name: true } } }
    })
  ]);

  const recentLogs = allLogs.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back, {session.user.name || 'User'}</h1>
        <p className="text-sm text-text-secondary">Here is an overview of your automation workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Workflows" 
          value={totalWorkflows} 
          description="Automations built in this workspace" 
        />
        <MetricCard 
          title="Active Runs" 
          value={activeRuns} 
          description="Executions currently processing" 
        />
        <MetricCard 
          title="Failed Executions" 
          value={0} 
          description="In the last 24 hours" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <DashboardAnalytics logs={allLogs} />
        </div>

        <div className="lg:col-span-3 bg-card border border-border-subtle rounded-sm p-6 flex flex-col">
          <h2 className="text-base font-medium text-foreground mb-4">Recent Executions</h2>
          <div className="flex-1 overflow-y-auto">
            {recentLogs.length > 0 ? (
              <div className="space-y-3 pr-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                    <div>
                      <Link href={`/dashboard/workflows/${log.workflow.id}`} className="text-sm font-medium text-foreground hover:text-accent-blue transition-colors block">
                        {log.workflow.name}
                      </Link>
                      <p className="text-xs text-text-secondary mt-0.5">{new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.status === 'ACTIVE' ? 'bg-accent-blue/10 text-accent-blue' :
                        log.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-text-secondary">No recent executions found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
