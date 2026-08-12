import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import { inngest } from '@/inngest/client';
import { SYSTEM_STATUS } from '@/constants';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, testPayload } = await req.json();

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 });
    }

    // Verify Workflow Exists and belongs to user
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true, clientId: true, nodesJson: true }
    });

    if (!workflow || (workflow.clientId !== session.user.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Workflow not found or unauthorized' }, { status: 404 });
    }

    // Create Execution Log marked as a TEST run
    const executionLog = await prisma.executionLog.create({
      data: {
        workflowId: workflow.id,
        externalReferenceId: 'TEST_RUN',
        status: SYSTEM_STATUS.ACTIVE,
        currentNodeState: { 
          step: 'TRIGGER', 
          payload: testPayload || {},
          isTest: true
        }
      }
    });

    // Trigger Vercel Workflow Engine
    await inngest.send({
      name: 'engine/workflow.start',
      data: {
        executionLogId: executionLog.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      executionLogId: executionLog.id,
      message: 'Test execution started'
    }, { status: 200 });

  } catch (error) {
    console.error('Test Flow API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
