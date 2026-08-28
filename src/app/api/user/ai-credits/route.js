import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deductUserAiCredit, getUserAiCredits } from '@/lib/ai-radahn/serverBrain';

export const dynamic = 'force-dynamic';

// GET: Return user's current AI credits
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creditsData = await getUserAiCredits(session.user.id);
    return NextResponse.json({
      success: true,
      ...creditsData
    });
  } catch (err) {
    console.error('Failed to get AI credits:', err);
    return NextResponse.json({ error: 'Failed to fetch AI credits' }, { status: 500 });
  }
}

// POST: Deduct credit for an AI Radahn task
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cost = 1, operation = 'AI_RADAHN_OPERATION' } = await req.json();

    try {
      const result = await deductUserAiCredit(session.user.id, cost, operation);
      return NextResponse.json(result);
    } catch (creditErr) {
      if (creditErr.code === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json({
          error: 'INSUFFICIENT_CREDITS',
          message: 'You have exhausted your AI Task Credits. Upgrade your plan or add an AI credit pack to continue.',
          creditsRemaining: creditErr.creditsRemaining,
          subscriptionTier: creditErr.subscriptionTier
        }, { status: 402 }); // 402 Payment Required
      }
      throw creditErr;
    }
  } catch (err) {
    console.error('Failed to deduct AI credits:', err);
    return NextResponse.json({ error: err.message || 'Failed to process AI credits' }, { status: 500 });
  }
}
