import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in or create an account to submit an upgrade request.' }, { status: 401 });
    }

    const { plan, message, receiptScreenshot } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: 'Plan or request type is required' }, { status: 400 });
    }

    // Check 24-hour spam cooldown
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequest = await prisma.quotaRequest.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: twentyFourHoursAgo },
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentRequest) {
      const hoursRemaining = Math.max(1, Math.ceil((recentRequest.createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60)));
      return NextResponse.json({ 
        error: `You already have an active pending upgrade request. To prevent duplicates, please wait ~${hoursRemaining} hour(s) or until our team finishes reviewing your request.` 
      }, { status: 429 });
    }

    // For paid Pro plan upgrades, verify receipt screenshot is attached
    const isPaidUpgrade = typeof plan === 'string' && (plan.toLowerCase().includes('professional') || plan.toLowerCase().includes('pro'));
    if (isPaidUpgrade && !receiptScreenshot) {
      return NextResponse.json({ 
        error: 'Please attach a screenshot of your completed payment receipt to submit your upgrade request.' 
      }, { status: 400 });
    }

    // Create the quota request
    const newRequest = await prisma.quotaRequest.create({
      data: {
        userId: session.user.id,
        requestedPlan: plan,
        message: message || null,
        receiptUrl: receiptScreenshot || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, requestId: newRequest.id });
  } catch (error) {
    console.error('Quota Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
