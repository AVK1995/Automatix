import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const request = await prisma.quotaRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let updateData = {};

    if (body.customStorageMB) {
      // Custom Limit Approval
      updateData = {
        quotaTier: 'Custom Enterprise',
        maxStorageMB: Number(body.customStorageMB) || 200,
        maxVideos: Number(body.customVideos) || 10,
        maxVideoMB: Number(body.customVideoMB) || 50,
        maxImages: Number(body.customImages) || 50,
        maxImageMB: Number(body.customImageMB) || 8
      };
    } else {
      // Find the requested plan to get limits
      const plan = await prisma.storagePlan.findFirst({
        where: { name: request.requestedPlan }
      });

      if (plan) {
        updateData = {
          quotaTier: plan.name,
          maxVideos: plan.maxVideos,
          maxVideoMB: plan.maxVideoMB,
          maxImages: plan.maxImages,
          maxImageMB: plan.maxImageMB,
          maxStorageMB: plan.maxStorageMB
        };
      } else {
        // Handle Subscription Plans, Storage Plans, or AI Boosters
        const lowerPlan = (request.requestedPlan || '').toLowerCase();

        if (lowerPlan.includes('professional') || lowerPlan.includes('pro plan')) {
          updateData = {
            subscriptionTier: 'Professional',
            quotaTier: 'Professional (200 MB)',
            maxStorageMB: 200,
            maxVideos: 4,
            maxVideoMB: 25,
            maxImages: 30,
            maxImageMB: 5,
            aiCredits: { increment: 100 }
          };
        } else if (lowerPlan.includes('enterprise')) {
          updateData = {
            subscriptionTier: 'Enterprise',
            quotaTier: 'Enterprise Custom',
            maxStorageMB: 500,
            maxVideos: 8,
            maxVideoMB: 50,
            maxImages: 80,
            maxImageMB: 8,
            aiCredits: { increment: 500 }
          };
        } else if (lowerPlan.includes('starter pack') || lowerPlan.includes('+100 mb')) {
          updateData = {
            quotaTier: 'Starter Pack (+100 MB)',
            maxStorageMB: 150,
            maxVideos: 2,
            maxVideoMB: 25,
            maxImages: 15,
            maxImageMB: 2
          };
        } else if (lowerPlan.includes('growth pack') || lowerPlan.includes('+250 mb')) {
          updateData = {
            quotaTier: 'Growth Pack (+250 MB)',
            maxStorageMB: 300,
            maxVideos: 5,
            maxVideoMB: 35,
            maxImages: 40,
            maxImageMB: 5
          };
        } else if (lowerPlan.includes('power pack') || lowerPlan.includes('+500 mb')) {
          updateData = {
            quotaTier: 'Power Pack (+500 MB)',
            maxStorageMB: 550,
            maxVideos: 8,
            maxVideoMB: 50,
            maxImages: 80,
            maxImageMB: 8
          };
        } else if (lowerPlan.includes('starter ai') || lowerPlan.includes('+50 credits')) {
          updateData = {
            aiCredits: { increment: 50 }
          };
        } else if (lowerPlan.includes('pro ai') || lowerPlan.includes('+200 credits')) {
          updateData = {
            aiCredits: { increment: 200 }
          };
        } else if (lowerPlan.includes('ultra ai') || lowerPlan.includes('+500 credits')) {
          updateData = {
            aiCredits: { increment: 500 }
          };
        } else {
          // Fallback custom default
          updateData = {
            quotaTier: request.requestedPlan,
            maxStorageMB: 250,
            maxVideos: 5,
            maxVideoMB: 35,
            maxImages: 40,
            maxImageMB: 5
          };
        }
      }
    }

    // Update the request status
    await prisma.quotaRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Update the user's limits
    await prisma.user.update({
      where: { id: request.userId },
      data: updateData
    });

    // Notify the user about the approval
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: request.userId,
        type: 'STORAGE_QUOTA',
        message: `Your storage quota upgrade request has been approved! Your new tier is ${updateData.quotaTier}.`,
        status: 'UNREAD',
        metadata: {
          icon: 'CheckCircle2',
          color: 'green'
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, updatedLimits: updateData });
  } catch (error) {
    console.error('Approve Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
