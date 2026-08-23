import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // We still return success if the user isn't found to prevent email enumeration,
    // but we don't do any DB updates or send an email.
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const now = new Date();

    // 1. Check 15-day cooldown
    if (user.lastPasswordUpdatedAt) {
      const daysSinceUpdate = (now - new Date(user.lastPasswordUpdatedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 15) {
        return NextResponse.json({ error: `You recently updated your password. Please wait ${Math.ceil(15 - daysSinceUpdate)} more days before resetting again.` }, { status: 429 });
      }
    }

    // 2. Check daily email limits (3 max per 24 hours)
    let newEmailCount = user.resetEmailCount;
    if (user.lastResetEmailAt) {
      const hoursSinceLastEmail = (now - new Date(user.lastResetEmailAt)) / (1000 * 60 * 60);
      if (hoursSinceLastEmail > 24) {
        // Reset the daily count if it's been more than 24 hours
        newEmailCount = 0;
      }
    }

    if (newEmailCount >= 3) {
      return NextResponse.json({ error: 'You have reached the maximum daily limit (3) for password reset emails. Please try again tomorrow.' }, { status: 429 });
    }

    // Generate secure token (DO NOT update user password here, only set the VerificationToken)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours expiry for user resets

    // Delete existing tokens for this email to avoid clutter
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    
    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: rawToken,
        expires,
      }
    });

    // Update limits
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetEmailCount: newEmailCount + 1,
        lastResetEmailAt: now,
      }
    });

    // Send email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupLink = `${baseUrl}/setup-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    
    await import('@/lib/mail').then(m => m.sendResetEmail(user.email, setupLink));

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
