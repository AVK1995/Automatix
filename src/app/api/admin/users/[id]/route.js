import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { 
      tier, 
      cycle, 
      maxImages, 
      maxImageMB, 
      maxVideos, 
      maxVideoMB, 
      maxDocs, 
      maxDocMB, 
      maxStorageMB, 
      quotaTier,
      aiCredits,
      maxSupportTickets,
      ticketCooldownHours
    } = await request.json();

    if (!tier || !cycle) {
      return NextResponse.json({ error: 'Tier and cycle are required' }, { status: 400 });
    }

    const lowerTier = tier.toLowerCase();
    const lowerCycle = cycle.toLowerCase();

    // Recalculate expiry based on cycle
    const daysToAdd = lowerCycle === 'yearly' ? 365 : lowerCycle === 'quarterly' ? 90 : 30;
    const subscriptionExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const data = {
      subscriptionTier: tier,
      subscriptionCycle: cycle,
      subscriptionExpiresAt,
      storageStatus: 'ACTIVE',
    };

    // Auto-sync default entitlements if upgrading tier
    if (lowerTier === 'professional' || lowerTier === 'pro') {
      data.quotaTier = quotaTier && !quotaTier.includes('Free Plan') ? quotaTier : 'Professional (200 MB)';
      data.maxStorageMB = maxStorageMB ? Number(maxStorageMB) : 200;
      data.maxImages = maxImages ? Number(maxImages) : 30;
      data.maxImageMB = maxImageMB ? Number(maxImageMB) : 5;
      data.maxVideos = maxVideos ? Number(maxVideos) : 4;
      data.maxVideoMB = maxVideoMB ? Number(maxVideoMB) : 25;
      data.maxDocs = maxDocs ? Number(maxDocs) : 40;
      data.maxDocMB = maxDocMB ? Number(maxDocMB) : 10;
      if (aiCredits !== undefined) {
        data.aiCredits = Number(aiCredits);
      }
    } else if (lowerTier === 'enterprise') {
      data.quotaTier = quotaTier && !quotaTier.includes('Free Plan') ? quotaTier : 'Enterprise (500 MB)';
      data.maxStorageMB = maxStorageMB ? Number(maxStorageMB) : 500;
      data.maxImages = maxImages ? Number(maxImages) : 80;
      data.maxImageMB = maxImageMB ? Number(maxImageMB) : 8;
      data.maxVideos = maxVideos ? Number(maxVideos) : 8;
      data.maxVideoMB = maxVideoMB ? Number(maxVideoMB) : 50;
      data.maxDocs = maxDocs ? Number(maxDocs) : 100;
      data.maxDocMB = maxDocMB ? Number(maxDocMB) : 20;
      if (aiCredits !== undefined) {
        data.aiCredits = Number(aiCredits);
      }
    } else {
      // Starter
      data.quotaTier = quotaTier || 'Free Plan (50 MB)';
      if (maxImages !== undefined) data.maxImages = Number(maxImages);
      if (maxImageMB !== undefined) data.maxImageMB = Number(maxImageMB);
      if (maxVideos !== undefined) data.maxVideos = Number(maxVideos);
      if (maxVideoMB !== undefined) data.maxVideoMB = Number(maxVideoMB);
      if (maxDocs !== undefined) data.maxDocs = Number(maxDocs);
      if (maxDocMB !== undefined) data.maxDocMB = Number(maxDocMB);
      if (maxStorageMB !== undefined) data.maxStorageMB = Number(maxStorageMB);
      if (aiCredits !== undefined) data.aiCredits = Number(aiCredits);
    }

    if (maxSupportTickets !== undefined) data.maxSupportTickets = Number(maxSupportTickets);
    if (ticketCooldownHours !== undefined) data.ticketCooldownHours = Number(ticketCooldownHours);

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
