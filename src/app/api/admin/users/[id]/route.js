import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { tier, cycle } = await request.json();

    if (!tier || !cycle) {
      return NextResponse.json({ error: 'Tier and cycle are required' }, { status: 400 });
    }

    // Recalculate expiry based on cycle
    const daysToAdd = cycle === 'yearly' ? 365 : 30;
    const subscriptionExpiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        subscriptionTier: tier,
        subscriptionCycle: cycle,
        subscriptionExpiresAt,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
