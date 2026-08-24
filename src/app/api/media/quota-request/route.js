import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, message } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: 'Plan or request type is required' }, { status: 400 });
    }

    // Create the quota request
    await prisma.quotaRequest.create({
      data: {
        userId: session.user.id,
        requestedPlan: plan,
        message: message || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quota Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
