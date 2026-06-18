import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours

    // 1. Update user's password to the hash (revoking old access immediately)
    await prisma.user.update({
      where: { id },
      data: { password: hashedToken }
    });

    // 2. Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: rawToken,
        expires,
      }
    });

    // 3. Construct the full setup URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupLink = `${baseUrl}/setup-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    return NextResponse.json({ success: true, setupLink });

  } catch (error) {
    console.error('Reset link generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
