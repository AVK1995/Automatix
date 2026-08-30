import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: workflowId } = await params;
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 250);

    // Strict 90-Day Retention Enforcement
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Auto-prune logs older than 90 days in the background
    prisma.executionLog.deleteMany({
      where: {
        workflowId,
        createdAt: { lt: ninetyDaysAgo }
      }
    }).catch(() => {});

    // Construct Date Filter (Bounded by 90-day retention ceiling)
    const createdAtFilter = { gte: ninetyDaysAgo };

    if (startDateParam) {
      const customStart = new Date(startDateParam);
      if (customStart > ninetyDaysAgo) {
        createdAtFilter.gte = customStart;
      }
    }

    if (endDateParam) {
      const customEnd = new Date(endDateParam);
      // Set to end of day
      customEnd.setHours(23, 59, 59, 999);
      createdAtFilter.lte = customEnd;
    }

    const [workflow, logs] = await Promise.all([
      prisma.workflow.findUnique({
        where: { id: workflowId },
        select: { id: true, name: true, nodesJson: true }
      }),
      prisma.executionLog.findMany({
        where: {
          workflowId,
          createdAt: createdAtFilter
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          analyticsEvents: true
        }
      })
    ]);

    // Reconstruct step flow from workflow nodes if available
    const parsedNodes = Array.isArray(workflow?.nodesJson) ? workflow.nodesJson : [];

    return NextResponse.json({
      workflowName: workflow?.name || 'Workflow Automation',
      nodes: parsedNodes,
      logs
    });
  } catch (error) {
    console.error('Error fetching execution history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
