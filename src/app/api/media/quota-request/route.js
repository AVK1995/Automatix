import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in or create an account to submit an upgrade request.' }, { status: 401 });
    }

    const { plan, billingCycle, storageAddon, aiAddon, message, receiptScreenshot } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: 'Plan or request type is required' }, { status: 400 });
    }

    // Fetch user details
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        media: { select: { sizeMB: true } }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const currentUsedMB = (dbUser.media || []).reduce((sum, m) => sum + (m.sizeMB || 0), 0);
    const userTier = (dbUser.subscriptionTier || 'starter').toLowerCase();
    const userCycle = (dbUser.subscriptionCycle || 'monthly').toLowerCase();
    const userExpiry = dbUser.subscriptionExpiresAt ? new Date(dbUser.subscriptionExpiresAt) : null;
    const daysUntilExpiry = userExpiry ? (userExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 999;
    const isWithinFinal5Days = daysUntilExpiry <= 5 && daysUntilExpiry >= 0;

    const lowerTargetPlan = (plan || '').toLowerCase();
    const targetCycle = (billingCycle || 'monthly').toLowerCase();

    // 1. Same-Plan Check: Cannot re-purchase identical active plan unless in final 5 days
    const isTargetingSame = (lowerTargetPlan.includes('professional') && userTier.includes('pro') && targetCycle === userCycle) ||
                           (lowerTargetPlan.includes('enterprise') && userTier.includes('ent') && targetCycle === userCycle);

    if (isTargetingSame && !isWithinFinal5Days) {
      return NextResponse.json({
        error: `Your ${dbUser.subscriptionTier} (${dbUser.subscriptionCycle}) plan is currently active until ${userExpiry ? userExpiry.toLocaleDateString() : 'expiry'}. Renewals open 5 days prior to expiration.`
      }, { status: 400 });
    }

    // 2. Downgrade Check: Cannot downgrade tier or cycle unless in final 5 days
    const isDowngrade = (userTier.includes('ent') && lowerTargetPlan.includes('pro')) ||
                        (userTier.includes('pro') && lowerTargetPlan.includes('starter')) ||
                        (userCycle === 'yearly' && targetCycle !== 'yearly') ||
                        (userCycle === 'quarterly' && targetCycle === 'monthly');

    if (isDowngrade && !isWithinFinal5Days) {
      return NextResponse.json({
        error: `Plan downgrades are only permitted during the final 5 days before your current plan expires.`
      }, { status: 400 });
    }

    // 3. Storage Downgrade Check
    let targetMaxStorage = 50;
    if (lowerTargetPlan.includes('storage')) {
      targetMaxStorage = dbUser.maxStorageMB || 50;
    } else if (lowerTargetPlan.includes('enterprise')) {
      targetMaxStorage = 500;
    } else if (lowerTargetPlan.includes('professional') || lowerTargetPlan.includes('pro')) {
      targetMaxStorage = 200;
    }

    if (storageAddon && typeof storageAddon === 'string') {
      if (storageAddon.includes('1000') || storageAddon.includes('1 gb') || storageAddon.includes('1gb') || storageAddon.includes('ultra')) targetMaxStorage += 1000;
      else if (storageAddon.includes('500')) targetMaxStorage += 500;
      else if (storageAddon.includes('250')) targetMaxStorage += 250;
      else if (storageAddon.includes('100')) targetMaxStorage += 100;
    }

    if (currentUsedMB > targetMaxStorage) {
      return NextResponse.json({
        error: `Your storage bucket currently holds ${currentUsedMB.toFixed(1)} MB, which exceeds the ${targetMaxStorage} MB limit of the selected package. Please delete files before downgrading storage, or older assets will be permanently pruned.`
      }, { status: 400 });
    }

    // 4. 24-Hour Cooldown & Anti-Spam Check
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequest = await prisma.quotaRequest.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: twentyFourHoursAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentRequest) {
      const hoursRemaining = Math.max(1, Math.ceil((recentRequest.createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60)));
      return NextResponse.json({ 
        error: `Anti-Spam Policy Active: You can only submit 1 upgrade request every 24 hours. Please wait ~${hoursRemaining} hour(s) before submitting another request.` 
      }, { status: 429 });
    }

    // 5. Payment Receipt Check for Paid Upgrades
    const isPaidUpgrade = !lowerTargetPlan.includes('starter') && !lowerTargetPlan.includes('free');
    if (isPaidUpgrade && !receiptScreenshot) {
      return NextResponse.json({ 
        error: 'Please attach a screenshot of your completed UPI payment receipt to verify your transfer.' 
      }, { status: 400 });
    }

    // 6. Create Quota Request
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
