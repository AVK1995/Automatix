'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const isAdmin = session.user.role === 'ADMIN';

  if (isAdmin) {
    // 1. Fetch direct admin notifications from DB (Only UNREAD)
    const directNotifications = await prisma.notification.findMany({
      where: { 
        userId: session.user.id,
        status: 'UNREAD'
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 2. Fetch pending Storage Quota Requests
    const pendingQuotaRequests = await prisma.quotaRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 3. Fetch open Support Tickets awaiting response
    const openTickets = await prisma.supportTicket.findMany({
      where: { status: 'OPEN' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    // 4. Fetch grace period accounts
    const graceAccounts = await prisma.user.findMany({
      where: { storageStatus: 'GRACE_PERIOD' },
      select: { id: true, name: true, email: true, storageGraceExpiresAt: true, quotaTier: true },
      take: 20
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

  // Client user: fetch only UNREAD direct notifications
  const directNotifications = await prisma.notification.findMany({
    where: { 
      userId: session.user.id,
      status: 'UNREAD'
    },
    orderBy: { createdAt: 'desc' },
    take: 25
  });

  // Enrich announcements/system notifications with AdminEmailLog full HTML body if missing
  const needsEnrichment = directNotifications.filter(n => {
    let meta = n.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch {}
    }
    return !meta?.htmlContent && ['ANNOUNCEMENT', 'SYSTEM', 'BILLING', 'LEGAL', 'DIRECT', 'SYSTEM_UPDATE'].includes(n.type);
  });

  if (needsEnrichment.length > 0) {
    try {
      const emailLogs = await prisma.adminEmailLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { id: true, subject: true, body: true, category: true, createdAt: true }
      });

      if (emailLogs.length > 0) {
        directNotifications.forEach(n => {
          let meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata || '{}') : (n.metadata || {});
          if (!meta.htmlContent) {
            const notifSubject = meta.subject || (n.message?.includes(':') ? n.message.split(':')[0] : n.message);
            const matchedLog = emailLogs.find(l => 
              (notifSubject && l.subject && (l.subject.toLowerCase().includes(notifSubject.toLowerCase()) || notifSubject.toLowerCase().includes(l.subject.toLowerCase()))) ||
              l.category === n.type
            ) || emailLogs[0];

            if (matchedLog) {
              n.metadata = {
                ...meta,
                subject: meta.subject || matchedLog.subject,
                htmlContent: matchedLog.body,
                category: meta.category || matchedLog.category
              };
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to enrich notifications:', err);
    }
  }

  // Filter out any notifications for tickets that have already been closed or resolved
  const ticketIds = directNotifications
    .map(n => n.metadata?.ticketId)
    .filter(Boolean);

  if (ticketIds.length > 0) {
    const closedTickets = await prisma.supportTicket.findMany({
      where: {
        id: { in: ticketIds },
        status: { in: ['CLOSED', 'RESOLVED'] }
      },
      select: { id: true, status: true }
    });
    
    if (closedTickets.length > 0) {
      const closedIdSet = new Set(closedTickets.map(t => t.id));
      const staleNotifIds = directNotifications
        .filter(n => n.metadata?.ticketId && closedIdSet.has(n.metadata.ticketId))
        .map(n => n.id);

      if (staleNotifIds.length > 0) {
        // Auto-resolve stale notifications asynchronously
        await prisma.notification.updateMany({
          where: { id: { in: staleNotifIds } },
          data: { status: 'RESOLVED' }
        });
        return directNotifications.filter(n => !staleNotifIds.includes(n.id));
      }
    }
  }

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

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.notification.updateMany({
    where: { 
      userId: session.user.id,
      status: 'UNREAD' 
    },
    data: { status: 'RESOLVED' }
  });

  return { success: true };
}

export async function resolveTicketNotifications(ticketId) {
  const session = await auth();
  if (!session?.user?.id || !ticketId) return { success: true };

  const notifs = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      status: 'UNREAD'
    }
  });

  const matchingIds = notifs
    .filter(n => n.metadata?.ticketId === ticketId)
    .map(n => n.id);

  if (matchingIds.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: matchingIds } },
      data: { status: 'RESOLVED' }
    });
  }

  return { success: true };
}
