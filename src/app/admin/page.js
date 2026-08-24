import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const now = new Date();
  const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  // Execute parallel queries for the priority command center
  const [
    totalWorkflows,
    totalUsers,
    pendingQuotaRequests,
    openTickets,
    expiringUsers,
    recentSignups,
    recentEmailLogs
  ] = await Promise.all([
    prisma.workflow.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.quotaRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, subscriptionTier: true, quotaTier: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 20
    }),
    prisma.user.findMany({
      where: {
        role: 'CLIENT',
        OR: [
          { storageStatus: 'GRACE_PERIOD' },
          { subscriptionExpiresAt: { lte: fiveDaysFromNow, not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        quotaTier: true,
        storageStatus: true,
        autoPayEnabled: true,
        subscriptionExpiresAt: true,
        storageGraceExpiresAt: true,
        lastReminderStage: true
      },
      orderBy: { subscriptionExpiresAt: 'asc' },
      take: 25
    }),
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        quotaTier: true,
        storageStatus: true,
        createdAt: true
      }
    }),
    prisma.adminEmailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  const stats = {
    totalWorkflows,
    totalUsers
  };

  return (
    <AdminDashboardClient
      stats={stats}
      pendingQuotaRequests={pendingQuotaRequests}
      openTickets={openTickets}
      expiringUsers={expiringUsers}
      recentSignups={recentSignups}
      recentEmailLogs={recentEmailLogs}
    />
  );
}
