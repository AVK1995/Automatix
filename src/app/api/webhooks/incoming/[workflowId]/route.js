import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';
import { SYSTEM_STATUS } from '@/constants';
import { verifyMetaSignature, verifyCalendlySignature } from '@/lib/verifyWebhook';

export async function POST(request, { params }) {
  try {
    // Await params in Next.js 15+ App Router
    const { workflowId } = await params;
    
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers);

    // Signature Verification
    if (headers['x-hub-signature-256']) {
      if (!verifyMetaSignature(rawBody, headers['x-hub-signature-256'])) {
        return NextResponse.json({ error: 'Invalid Meta Signature' }, { status: 401 });
      }
    } else if (headers['calendly-webhook-signature']) {
      if (!verifyCalendlySignature(rawBody, headers['calendly-webhook-signature'])) {
        return NextResponse.json({ error: 'Invalid Calendly Signature' }, { status: 401 });
      }
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    // Extract an external reference ID if one exists (e.g., from Calendly or Meta)
    // This is crucial for the Pre-Flight Guard (Kill Switch)
    const externalReferenceId = body.external_reference_id || body.invitee_uuid || null;

    // 1. Verify Workflow Exists and is Active
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, isActive: true }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.isActive) {
      return NextResponse.json({ error: 'Workflow is currently inactive' }, { status: 400 });
    }

    // 2. Initialize Execution Log (Start of Run)
    const executionLog = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        externalReferenceId: externalReferenceId,
        status: SYSTEM_STATUS.ACTIVE,
        currentNodeState: { step: 'TRIGGER', payload: body }
      }
    });

    // 3. Trigger Vercel Workflow Engine
    await inngest.send({
      name: 'engine/workflow.start',
      data: {
        executionLogId: executionLog.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      executionLogId: executionLog.id,
      message: 'Workflow execution started'
    }, { status: 200 });

  } catch (error) {
    console.error('Incoming Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
