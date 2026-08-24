import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalStorageUsedMB = user.media.reduce((sum, m) => sum + (m.sizeMB || 0), 0);
    const videoCount = user.media.filter(m => m.type === 'VIDEO').length;
    const imageCount = user.media.filter(m => m.type === 'IMAGE').length;

    return NextResponse.json({
      user: {
        ...user,
        totalStorageUsedMB: Number(totalStorageUsedMB.toFixed(1)),
        videoCount,
        imageCount
      }
    });
  } catch (error) {
    console.error('Fetch Billing Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
