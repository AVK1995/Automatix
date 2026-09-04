import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
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
      where: { id },
      include: {
        user: {
          select: { 
            id: true, 
            email: true, 
            name: true, 
            maxStorageMB: true, 
            aiCredits: true,
            subscriptionTier: true,
            subscriptionCycle: true,
            subscriptionExpiresAt: true,
            maxImages: true,
            maxVideos: true,
            maxDocs: true,
            maxImageMB: true,
            maxVideoMB: true,
            maxDocMB: true
          }
        }
      }
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const user = request.user;
    const lowerPlan = (request.requestedPlan || '').toLowerCase();
    const lowerMsg = (request.message || '').toLowerCase();
    const isStorageOnly = lowerPlan.includes('storage') && !lowerPlan.includes('professional') && !lowerPlan.includes('enterprise');

    // 1. Determine Billing Cycle & Expiry Duration
    let cycle = isStorageOnly ? (user?.subscriptionCycle || 'monthly') : 'monthly';
    let multiplier = 1;
    if (!isStorageOnly) {
      if (lowerPlan.includes('yearly') || lowerPlan.includes('12 month') || lowerMsg.includes('yearly')) {
        cycle = 'yearly';
        multiplier = 12;
      } else if (lowerPlan.includes('quarterly') || lowerPlan.includes('3 month') || lowerMsg.includes('quarterly')) {
        cycle = 'quarterly';
        multiplier = 3;
      }
    }

    const daysToAdd = 30 * multiplier;
    const subscriptionExpiresAt = isStorageOnly && user?.subscriptionExpiresAt 
      ? user.subscriptionExpiresAt 
      : new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    // 2. Base Limits
    let tier = isStorageOnly ? (user?.subscriptionTier || 'Starter') : 'Professional';
    let baseStorage = isStorageOnly ? (user?.maxStorageMB || 50) : 200;
    let baseImages = isStorageOnly ? (user?.maxImages || 15) : 30;
    let baseVideos = isStorageOnly ? (user?.maxVideos || 1) : 4;
    let baseDocs = isStorageOnly ? (user?.maxDocs || 20) : 40;
    let baseAiCredits = isStorageOnly ? 0 : 100;

    if (!isStorageOnly && (lowerPlan.includes('enterprise') || lowerMsg.includes('enterprise'))) {
      tier = 'Enterprise';
      baseStorage = 500;
      baseImages = 80;
      baseVideos = 8;
      baseDocs = 100;
      baseAiCredits = 500;
    }

    // 3. Storage Addon Calculation
    let extraStorage = 0;
    if (lowerMsg.includes('+1000 mb') || lowerMsg.includes('1 gb') || lowerMsg.includes('ultra pack')) {
      extraStorage = 1000;
      baseImages += 100;
      baseVideos += 8;
      baseDocs += 100;
    } else if (lowerMsg.includes('+500 mb') || lowerMsg.includes('power pack')) {
      extraStorage = 500;
      baseImages += 50;
      baseVideos += 4;
      baseDocs += 50;
    } else if (lowerMsg.includes('+250 mb') || lowerMsg.includes('growth pack')) {
      extraStorage = 250;
      baseImages += 25;
      baseVideos += 2;
      baseDocs += 25;
    } else if (lowerMsg.includes('+100 mb') || lowerMsg.includes('starter pack')) {
      extraStorage = 100;
      baseImages += 10;
      baseVideos += 1;
      baseDocs += 10;
    }

    // 4. AI Addon Calculation
    let extraAiCredits = 0;
    if (lowerMsg.includes('+500 credit') || lowerMsg.includes('ultra ai')) {
      extraAiCredits = 500;
    } else if (lowerMsg.includes('+150 credit') || lowerMsg.includes('+200 credit') || lowerMsg.includes('pro ai')) {
      extraAiCredits = 150;
    } else if (lowerMsg.includes('+50 credit') || lowerMsg.includes('starter ai')) {
      extraAiCredits = 50;
    }

    const totalStorageMB = (user?.maxStorageMB && isStorageOnly) ? (user.maxStorageMB + extraStorage) : Math.max(user?.maxStorageMB || 50, baseStorage + extraStorage);
    const totalAiCredits = (user?.aiCredits || 10) + baseAiCredits + extraAiCredits;

    const updateData = {
      subscriptionTier: tier,
      subscriptionCycle: cycle,
      subscriptionExpiresAt,
      storagePlanExpiresAt: subscriptionExpiresAt,
      storageStatus: 'ACTIVE',
      quotaTier: `${tier} (${totalStorageMB} MB)`,
      maxStorageMB: totalStorageMB,
      maxImages: baseImages,
      maxImageMB: tier === 'Enterprise' ? 8 : 5,
      maxVideos: baseVideos,
      maxVideoMB: tier === 'Enterprise' ? 50 : 25,
      maxDocs: baseDocs,
      maxDocMB: tier === 'Enterprise' ? 20 : 10,
      aiCredits: totalAiCredits
    };

    // Update Request status
    await prisma.quotaRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Update User record
    await prisma.user.update({
      where: { id: request.userId },
      data: updateData
    });

    // Create In-App Notification
    const notifMessage = isStorageOnly
      ? `🎉 Payment Verified & Storage Expanded! +${extraStorage}MB has been added to your media bucket (Total Quota: ${totalStorageMB}MB).`
      : `🎉 Payment Verified & Access Granted! Your account is now active on the ${tier} tier (${cycle}) with ${totalStorageMB}MB storage and ${totalAiCredits} AI credits.`;

    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: request.userId,
        type: 'STORAGE_QUOTA',
        message: notifMessage,
        status: 'UNREAD',
        metadata: {
          icon: 'CheckCircle2',
          color: 'green'
        },
        updatedAt: new Date()
      }
    });

    // Send Confirmation Email
    if (user?.email) {
      const emailSubject = isStorageOnly
        ? `🚀 Storage Quota Expanded: ${totalStorageMB} MB Now Available!`
        : `🚀 Access Granted: Your Automatix ${tier} Plan is Active!`;
      
      const emailBody = isStorageOnly
        ? `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 540px; margin: auto; padding: 32px; background: #0e0e13; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <h2 style="color: #3b82f6; margin-top: 0;">Payment Verified & Storage Expanded!</h2>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
              Hello ${user.name || 'there'}, your storage add-on payment has been verified by our team. Your media bucket capacity has been successfully increased.
            </p>
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 4px 0;"><strong>Added Capacity:</strong> +${extraStorage} MB</p>
              <p style="margin: 4px 0;"><strong>Total Cloud Storage:</strong> ${totalStorageMB} MB</p>
              <p style="margin: 4px 0;"><strong>Active Tier:</strong> ${tier}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL || 'https://automatix.agency'}/dashboard/storage" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">Open Storage Bucket</a>
          </div>
        `
        : `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 540px; margin: auto; padding: 32px; background: #0e0e13; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <h2 style="color: #3b82f6; margin-top: 0;">Payment Verified & Plan Activated!</h2>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
              Hello ${user.name || 'there'}, your payment has been verified by our team and your ${tier} plan is now fully active.
            </p>
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <p style="margin: 4px 0;"><strong>Active Tier:</strong> ${tier}</p>
              <p style="margin: 4px 0;"><strong>Billing Duration:</strong> ${cycle.toUpperCase()} (Valid until ${subscriptionExpiresAt.toLocaleDateString()})</p>
              <p style="margin: 4px 0;"><strong>Cloud Storage:</strong> ${totalStorageMB} MB</p>
              <p style="margin: 4px 0;"><strong>AI Credits Balance:</strong> ${totalAiCredits} Credits</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL || 'https://automatix.agency'}/dashboard" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">Open Dashboard</a>
          </div>
        `;

      await sendMail({
        to: user.email,
        subject: emailSubject,
        html: emailBody
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, updatedLimits: updateData });
  } catch (error) {
    console.error('Grant Access Error:', error);
    return NextResponse.json({ error: 'Failed to grant access and activate plan' }, { status: 500 });
  }
}
