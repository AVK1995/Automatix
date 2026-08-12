'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const notifications = await prisma.notification.findMany({
    where: { 
      userId: session.user.id,
      status: { in: ['UNREAD', 'IGNORED'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  return notifications;
}

export async function resolveNotification(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

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

  await prisma.notification.updateMany({
    where: { 
      id,
      userId: session.user.id 
    },
    data: { status: 'IGNORED' }
  });
  
  return { success: true };
}
