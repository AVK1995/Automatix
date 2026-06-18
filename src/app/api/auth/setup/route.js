import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        }
      }
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired setup link' }, { status: 400 });
    }

    // Check expiration
    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
      return NextResponse.json({ error: 'Setup link has expired. Please contact support.' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user and delete token atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
