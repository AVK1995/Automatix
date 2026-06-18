import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, tier } = await request.json();

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Ensure user doesn't already exist
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Create the User (no password yet)
    const newUser = await prisma.user.create({
      data: {
        email,
        role: 'CLIENT',
        subscriptionTier: tier,
      }
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      }
    });

    // Construct the full setup URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupLink = `${baseUrl}/setup-password?token=${token}&email=${encodeURIComponent(email)}`;

    return NextResponse.json({ success: true, setupLink });

  } catch (error) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
