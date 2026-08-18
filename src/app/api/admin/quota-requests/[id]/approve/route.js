import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const request = await prisma.quotaRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Find the requested plan to get limits
    const plan = await prisma.storagePlan.findFirst({
      where: { name: request.requestedPlan }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Requested plan no longer exists in system' }, { status: 400 });
    }

    // Update the request status
    await prisma.quotaRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Update the user's limits
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        quotaTier: plan.name,
        maxVideos: plan.maxVideos,
        maxVideoMB: plan.maxVideoMB,
        maxImages: plan.maxImages,
        maxImageMB: plan.maxImageMB,
        maxStorageMB: plan.maxStorageMB
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
