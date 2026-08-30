import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!name || !email || !password || !otp) {
      return NextResponse.json({ error: 'All fields including the 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: cleanEmail,
        token: otp.trim()
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid verification code. Please check your email or request a new code.' }, { status: 400 });
    }

    if (new Date() > new Date(tokenRecord.expires)) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    const settings = await prisma.platformSettings.findFirst() || { maxUsers: 10, starterPlanEnabled: true };
    if (!settings.starterPlanEnabled) {
      return NextResponse.json({ error: 'Registration is currently disabled.' }, { status: 403 });
    }

    const userCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    if (userCount >= settings.maxUsers) {
      return NextResponse.json({ error: 'Maximum capacity reached. Please try again later.' }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        role: 'CLIENT',
        emailVerified: new Date()
      }
    });

    // Clean up used token
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail }
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
