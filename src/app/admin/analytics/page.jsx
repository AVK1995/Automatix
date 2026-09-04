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

  try {
    // Execute parallel queries with individual error fallbacks
    const [
      totalWorkflows,
      activeRuns,
      cancelledRuns,
      allLogs,
      usages,
      integrationUsages,
      allTenants
    ] = await Promise.all([
      prisma.workflow.count().catch(() => 0),
      prisma.executionLog.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.executionLog.count({ where: { status: 'CANCELLED' } }).catch(() => 0),
      prisma.executionLog.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        include: { 
          workflow: { 
            select: { 
              id: true, 
              name: true, 
              clientId: true,
              client: { select: { id: true, name: true, email: true } }
            } 
          } 
        }
      }).catch((err) => {
        console.error('[AdminAnalyticsPage] executionLog.findMany error:', err);
        return [];
      }),
      prisma.connectionUsage.groupBy({
        by: ['date'],
        _sum: { requestCount: true },
        orderBy: { date: 'desc' },
        take: 90
      }).catch(() => []),
      prisma.connectionUsage.groupBy({
        by: ['integrationId'],
        _sum: { requestCount: true },
        orderBy: { _sum: { requestCount: 'desc' } },
        take: 10
      }).catch(() => []),
      prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true, name: true, email: true }
      }).catch(() => [])
    ]);

    // Hydrate integration details safely
    const populatedIntegrations = await Promise.all(
      (integrationUsages || []).map(async (u) => {
        try {
          const integration = await prisma.integration.findUnique({
            where: { id: u.integrationId },
            include: { client: { select: { id: true, name: true, email: true } } }
          });
          return {
            ...u,
            integration
          };
        } catch (e) {
          return {
            ...u,
            integration: null
          };
        }
      })
    );

    // Cleanly serialize all Date objects to ISO strings across RSC boundary
    const serializedLogs = (allLogs || []).map(log => ({
      ...log,
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt || ''),
      completedAt: log.completedAt ? (log.completedAt instanceof Date ? log.completedAt.toISOString() : String(log.completedAt)) : null,
      updatedAt: log.updatedAt ? (log.updatedAt instanceof Date ? log.updatedAt.toISOString() : String(log.updatedAt)) : null
    }));

    const serializedUsages = (usages || []).map(u => ({
      ...u,
      date: u.date instanceof Date ? u.date.toISOString() : String(u.date || ''),
      _sum: { requestCount: u._sum?.requestCount || 0 }
    }));

    return (
      <AdminAnalyticsClient
        totalWorkflows={totalWorkflows || 0}
        activeRuns={activeRuns || 0}
        cancelledRuns={cancelledRuns || 0}
        allLogs={serializedLogs}
        usages={serializedUsages}
        populatedIntegrations={populatedIntegrations}
        allTenants={allTenants || []}
      />
    );
  } catch (err) {
    console.error('AdminAnalyticsPage server render error:', err);
    return (
      <AdminAnalyticsClient
        totalWorkflows={0}
        activeRuns={0}
        cancelledRuns={0}
        allLogs={[]}
        usages={[]}
        populatedIntegrations={[]}
        allTenants={[]}
      />
    );
  }
}
