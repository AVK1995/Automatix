import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { executeAiRadahnInference } from '@/lib/ai-radahn/serverBrain';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { 
      mode, 
      selectedDeployments = [], 
      customNotes = '', 
      tone = 'modern_dark', 
      subject = '', 
      body = '', 
      instruction = '',
      triggerData = {},
      previousSteps = []
    } = await req.json();

    const result = await executeAiRadahnInference({
      userId: session.user.id,
      mode,
      instruction,
      tone,
      currentTemplate: body,
      customNotes,
      selectedDeployments,
      triggerData: { ...triggerData, subject },
      previousSteps
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Radahn Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate with AI Radahn' }, { status: 500 });
  }
}
