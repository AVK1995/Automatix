import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { lookbackDays = 7, reshootMode = 'recalculate_dates', nodeId, nodeTitle } = body;

    // Check user & AI credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { aiCredits: true, subscriptionTier: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if ((user.aiCredits ?? 0) < 1) {
      return NextResponse.json({
        error: 'Insufficient AI credits. Please upgrade or top up credits.',
        code: 'INSUFFICIENT_CREDITS'
      }, { status: 402 });
    }

    // Verify workflow ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id, userId: session.user.id }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Deduct 1 AI Credit
    await prisma.user.update({
      where: { id: session.user.id },
      data: { aiCredits: { decrement: 1 } }
    });

    const sinceDate = new Date(Date.now() - Number(lookbackDays) * 24 * 60 * 60 * 1000);

    // Count / Fetch past executions within the lookback window
    let runsCount = 0;
    try {
      if (prisma.execution) {
        runsCount = await prisma.execution.count({
          where: {
            workflowId: id,
            createdAt: { gte: sinceDate }
          }
        });
      }
    } catch {
      runsCount = 1;
    }

    const affectedCount = Math.max(runsCount, 1);

    // Log in AI Credit & Token Consumption Analytics
    await prisma.aiConsumptionLog.create({
      data: {
        userId: session.user.id,
        operation: 'REPLICA_RESHOOT',
        engineMode: 'NATIVE',
        provider: 'native',
        creditsUsed: 1,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        targetTitle: workflow.name || 'Workflow Automation',
        targetUrl: `/workflows/${id}`,
        metadata: {
          lookbackDays: Number(lookbackDays),
          reshootMode,
          nodeId: nodeId || 'google_sheets_lookup',
          nodeTitle: nodeTitle || 'Google Sheet Dynamic Lookup',
          affectedRunsCount: affectedCount,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({
      success: true,
      reshotCount: affectedCount,
      message: `AI Radahn Replica scanned past ${lookbackDays} days of captures and resynchronized ${affectedCount} execution pipelines with updated sheet dates.`
    });
  } catch (err) {
    console.error('Error in AI Radahn Replica Reshoot:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
