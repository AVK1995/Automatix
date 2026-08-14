import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const settings = await prisma.platformSettings.findFirst() || { maxUsers: 10, starterPlanEnabled: true };
    if (!settings.starterPlanEnabled) {
      return NextResponse.json({ error: 'Registration is currently disabled.' }, { status: 403 });
    }

    const userCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    if (userCount >= settings.maxUsers) {
      return NextResponse.json({ error: 'Maximum capacity reached. Please try again later.' }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENT',
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
