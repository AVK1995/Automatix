import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { SYSTEM_STATUS } from "@/constants";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { executionLogId, skipNodes = [], runOnlyNodeId = null } = body;

    if (!executionLogId) {
      return NextResponse.json({ error: "Missing executionLogId" }, { status: 400 });
    }

    const executionLog = await prisma.executionLog.findUnique({
      where: { id: executionLogId },
      include: { workflow: true }
    });

    if (!executionLog) {
      return NextResponse.json({ error: "Execution Log not found" }, { status: 404 });
    }

    // Security check: ensure workflow belongs to the user
    if (executionLog.workflow.clientId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!runOnlyNodeId) {
      // Entire workflow rerun (potentially with skips)
      await prisma.executionLog.update({
        where: { id: executionLogId },
        data: {
          status: SYSTEM_STATUS.ACTIVE,
          currentNodeState: null,
        }
      });

      // Clear old step logs for a clean slate
      await prisma.analyticsEvent.deleteMany({
        where: { executionLogId: executionLogId }
      });
    }

    // Dispatch Inngest Event
    await inngest.send({
      name: "engine/workflow.start",
      data: {
        executionLogId,
        skipNodes,
        runOnlyNodeId
      }
    });

    return NextResponse.json({ success: true, message: "Rerun triggered successfully" });
  } catch (error) {
    console.error("Rerun API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
