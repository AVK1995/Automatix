import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 400 });
    }

    // Check platform capacity
    const settings = await prisma.platformSettings.findFirst() || { maxUsers: 10, starterPlanEnabled: true };
    if (!settings.starterPlanEnabled) {
      return NextResponse.json({ error: 'Registration is currently disabled.' }, { status: 403 });
    }

    const userCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    if (userCount >= settings.maxUsers) {
      return NextResponse.json({ error: 'Maximum user capacity reached. Please contact support.' }, { status: 403 });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Upsert verification token
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail }
    });

    await prisma.verificationToken.create({
      data: {
        identifier: cleanEmail,
        token: otpCode,
        expires: expiresAt
      }
    });

    // Send email with OTP
    await sendMail({
      to: cleanEmail,
      subject: `🔐 Your Automatix Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: auto; padding: 32px; background: #0e0e13; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
          <h2 style="color: #3b82f6; font-size: 22px; font-weight: 800; margin-top: 0;">Email Verification</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for signing up for Automatix. Enter the 6-digit verification code below to verify your email and activate your account:
          </p>
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: monospace; margin: 24px auto; display: inline-block;">
            ${otpCode}
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
            This code will expire in 15 minutes. If you did not request this verification, you can safely ignore this message.
          </p>
        </div>
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: `Verification code sent to ${cleanEmail}` 
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
  }
}
