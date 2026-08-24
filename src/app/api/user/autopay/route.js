import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { autoPayEnabled: Boolean(enabled) },
      select: { id: true, autoPayEnabled: true }
    });

    return NextResponse.json({ success: true, autoPayEnabled: updatedUser.autoPayEnabled });
  } catch (error) {
    console.error('Update AutoPay Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
