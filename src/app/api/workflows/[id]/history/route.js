import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;

    const logs = await prisma.executionLog.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        analyticsEvents: true
      }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching execution history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
