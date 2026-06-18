import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SYSTEM_STATUS } from '@/constants';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Attempt to extract the external reference ID used for cancellation
    const externalReferenceId = body.external_reference_id || body.invitee_uuid || null;

    if (!externalReferenceId) {
      return NextResponse.json({ error: 'Missing external_reference_id in payload' }, { status: 400 });
    }

    // 1. Pre-Flight Guard (Kill Switch) Logic
    // Find any ACTIVE execution logs that match this external_reference_id
    // and instantly update their status to CANCELLED.
    const updatedRuns = await prisma.executionLog.updateMany({
      where: {
        externalReferenceId: externalReferenceId,
        status: SYSTEM_STATUS.ACTIVE,
      },
      data: {
        status: SYSTEM_STATUS.CANCELLED,
      }
    });

    if (updatedRuns.count === 0) {
      // It's possible the run already completed, or we never received it.
      // We still return 200 OK so the provider stops retrying the webhook.
      return NextResponse.json({ 
        success: true, 
        message: 'No active runs found to cancel.' 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true, 
      cancelledCount: updatedRuns.count,
      message: 'Active runs successfully cancelled (Kill Switch engaged).'
    }, { status: 200 });

  } catch (error) {
    console.error('Cancellation Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
