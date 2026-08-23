import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        supportTicketsRemaining: user.maxSupportTickets,
        ticketQuotaResetAt: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
