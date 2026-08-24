import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminAnalyticsClient from './AdminAnalyticsClient';

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
    integrationUsages,
    allTenants
  ] = await Promise.all([
    prisma.workflow.count(),
    prisma.executionLog.count({ where: { status: 'ACTIVE' } }),
    prisma.executionLog.count({ where: { status: 'CANCELLED' } }),
    prisma.executionLog.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
      include: { workflow: { select: { id: true, name: true, userId: true } } }
    }),
    prisma.connectionUsage.groupBy({
      by: ['date'],
      _sum: { requestCount: true },
      orderBy: { date: 'desc' },
      take: 90
    }),
    prisma.connectionUsage.groupBy({
      by: ['integrationId'],
      _sum: { requestCount: true },
      orderBy: { _sum: { requestCount: 'desc' } },
      take: 10
    }),
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true, name: true, email: true }
    })
  ]);

  // Hydrate integration details
  const populatedIntegrations = await Promise.all(
    integrationUsages.map(async (u) => {
      const integration = await prisma.integration.findUnique({
        where: { id: u.integrationId },
        include: { client: { select: { id: true, name: true, email: true } } }
      });
      return {
        ...u,
        integration
      };
    })
  );

  return (
    <AdminAnalyticsClient
      totalWorkflows={totalWorkflows}
      activeRuns={activeRuns}
      cancelledRuns={cancelledRuns}
      allLogs={allLogs}
      usages={usages}
      populatedIntegrations={populatedIntegrations}
      allTenants={allTenants}
    />
  );
}
