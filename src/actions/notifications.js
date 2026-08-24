'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const isAdmin = session.user.role === 'ADMIN';

  if (isAdmin) {
    // 1. Fetch direct admin notifications from DB
    const directNotifications = await prisma.notification.findMany({
      where: { 
        userId: session.user.id,
        status: { in: ['UNREAD', 'IGNORED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch pending Storage Quota Requests
    const pendingQuotaRequests = await prisma.quotaRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch open Support Tickets awaiting response
    const openTickets = await prisma.supportTicket.findMany({
      where: { status: 'OPEN' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    // 4. Fetch grace period accounts
    const graceAccounts = await prisma.user.findMany({
      where: { storageStatus: 'GRACE_PERIOD' },
      select: { id: true, name: true, email: true, storageGraceExpiresAt: true, quotaTier: true }
    });

    // 5. Fetch recent new registrations (last 3 days)
    const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const newSignups = await prisma.user.findMany({
      where: { 
        role: 'CLIENT',
        createdAt: { gte: recentDate }
      },
      select: { id: true, name: true, email: true, createdAt: true, subscriptionTier: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Format quota requests
    const quotaNotifications = pendingQuotaRequests.map(r => ({
      id: `quota-${r.id}`,
      type: 'QUOTA_REQUEST',
      message: `Pending Storage Quota: ${r.user?.name || r.user?.email} requested "${r.requestedPlan}"`,
      metadata: {
        targetUrl: '/admin/requests',
        clientEmail: r.user?.email,
        note: r.message,
        category: 'Storage Quota'
      },
      status: 'UNREAD',
      createdAt: r.createdAt
    }));

    // Format support tickets
    const ticketNotifications = openTickets.map(t => ({
      id: `ticket-${t.id}`,
      type: 'SUPPORT_TICKET',
      message: `New Support Ticket: "${t.subject}" from ${t.user?.name || t.user?.email}`,
      metadata: {
        targetUrl: '/admin/support',
        ticketId: t.id,
        category: t.type
      },
      status: 'UNREAD',
      createdAt: t.updatedAt
    }));

    // Format grace period notifications
    const graceNotifications = graceAccounts.map(g => ({
      id: `grace-${g.id}`,
      type: 'GRACE_PERIOD',
      message: `Overdue Account in Grace Period: ${g.name || g.email} is pending storage purge`,
      metadata: {
        targetUrl: `/admin/users/${g.id}`,
        userId: g.id
      },
      status: 'UNREAD',
      createdAt: g.storageGraceExpiresAt || new Date()
    }));

    // Format signup notifications
    const signupNotifications = newSignups.map(s => ({
      id: `signup-${s.id}`,
      type: 'NEW_SIGNUP',
      message: `New Tenant Joined: ${s.name || 'Client'} (${s.email}) registered`,
      metadata: {
        targetUrl: `/admin/users/${s.id}`,
        userId: s.id
      },
      status: 'UNREAD',
      createdAt: s.createdAt
    }));

    // Combine and sort by newest first
    const combined = [
      ...quotaNotifications,
      ...ticketNotifications,
      ...graceNotifications,
      ...signupNotifications,
      ...directNotifications
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return combined;
  }

  // Client user
  const directNotifications = await prisma.notification.findMany({
    where: { 
      userId: session.user.id,
      status: { in: ['UNREAD', 'IGNORED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  return directNotifications;
}

export async function resolveNotification(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // If virtual notification, return success directly
  if (id.startsWith('quota-') || id.startsWith('ticket-') || id.startsWith('grace-') || id.startsWith('signup-')) {
    return { success: true };
  }

  await prisma.notification.updateMany({
    where: { 
      id,
      userId: session.user.id 
    },
    data: { status: 'RESOLVED' }
  });
  
  return { success: true };
}

export async function ignoreNotification(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // If virtual notification, return success directly
  if (id.startsWith('quota-') || id.startsWith('ticket-') || id.startsWith('grace-') || id.startsWith('signup-')) {
    return { success: true };
  }

  await prisma.notification.updateMany({
    where: { 
      id,
      userId: session.user.id 
    },
    data: { status: 'IGNORED' }
  });
  
  return { success: true };
}
