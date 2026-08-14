import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get total connection usages grouped by date
  const usages = await prisma.connectionUsage.groupBy({
    by: ['date'],
    _sum: {
      requestCount: true,
    },
    orderBy: {
      date: 'desc'
    },
    take: 30
  });

  const integrationUsages = await prisma.connectionUsage.groupBy({
    by: ['integrationId'],
    _sum: {
      requestCount: true,
    },
    orderBy: {
      _sum: {
        requestCount: 'desc'
      }
    },
    take: 10
  });

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-2">Admin Analytics</h1>
      <p className="text-text-secondary text-sm">System-wide API consumption and rate limit monitoring.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-card border border-border-subtle p-6 rounded-md">
          <h2 className="text-sm font-semibold text-white mb-4">Last 30 Days Usage</h2>
          <div className="space-y-3">
            {usages.length === 0 ? (
              <p className="text-xs text-text-secondary">No usage data recorded yet.</p>
            ) : (
              usages.map(u => (
                <div key={u.date.toISOString()} className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">{new Date(u.date).toLocaleDateString()}</span>
                  <span className="text-white font-mono">{u._sum.requestCount} requests</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border-subtle p-6 rounded-md">
          <h2 className="text-sm font-semibold text-white mb-4">Top Connections (All Time)</h2>
          <div className="space-y-4">
            {populatedIntegrations.length === 0 ? (
              <p className="text-xs text-text-secondary">No connections usage recorded yet.</p>
            ) : (
              populatedIntegrations.map((u, i) => (
                <div key={u.integrationId} className="flex justify-between items-center text-sm border-b border-border-subtle pb-3 last:border-0">
                  <div>
                    <p className="text-white font-medium">{u.integration?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-text-secondary mt-1">User: {u.integration?.client?.email || 'Unknown'}</p>
                    <p className="text-[10px] text-accent-blue mt-0.5">{u.integration?.providerName}</p>
                  </div>
                  <span className="text-white font-mono bg-white/5 px-2 py-1 rounded-sm">
                    {u._sum.requestCount} req
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
