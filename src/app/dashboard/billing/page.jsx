import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      subscriptionCycle: true,
      subscriptionExpiresAt: true,
      quotaTier: true,
      maxStorageMB: true,
      maxImages: true,
      maxImageMB: true,
      maxVideos: true,
      maxVideoMB: true,
      autoPayEnabled: true,
      storageStatus: true,
      storagePlanExpiresAt: true,
      storageGraceExpiresAt: true,
      invoices: {
        orderBy: { createdAt: 'desc' },
      },
      media: {
        select: { sizeMB: true, type: true }
      }
    }
  });

  if (!user) redirect('/login');

  const totalStorageUsedMB = user.media.reduce((sum, m) => sum + (m.sizeMB || 0), 0);
  const videoCount = user.media.filter(m => m.type === 'VIDEO').length;
  const imageCount = user.media.filter(m => m.type === 'IMAGE').length;

  const userData = {
    ...user,
    totalStorageUsedMB: Number(totalStorageUsedMB.toFixed(1)),
    videoCount,
    imageCount
  };

  return <BillingClient initialUser={userData} />;
}
