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

    return NextResponse.json({ success: true, updatedLimits: updateData });
  } catch (error) {
    console.error('Approve Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
