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
    const { executionLogId, executionLogIds = [], skipNodes = [], runOnlyNodeId = null } = body;

    const targetIds = executionLogIds.length > 0 ? executionLogIds : executionLogId ? [executionLogId] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "Missing executionLogId or executionLogIds" }, { status: 400 });
    }

    const executionLogs = await prisma.executionLog.findMany({
      where: { id: { in: targetIds } },
      include: { workflow: true }
    });

    if (!executionLogs || executionLogs.length === 0) {
      return NextResponse.json({ error: "Execution Logs not found" }, { status: 404 });
    }

    // Security check: ensure all workflows belong to user
    const unauthorized = executionLogs.some(
      log => log.workflow.clientId !== session.user.id && session.user.role !== 'ADMIN'
    );
    if (unauthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventsToSend = [];

    for (const log of executionLogs) {
      if (!runOnlyNodeId) {
        await prisma.executionLog.update({
          where: { id: log.id },
          data: {
            status: SYSTEM_STATUS.ACTIVE,
            currentNodeState: null,
          }
        });

        await prisma.analyticsEvent.deleteMany({
          where: { executionLogId: log.id }
        });
      }

      eventsToSend.push({
        name: "engine/workflow.start",
        data: {
          executionLogId: log.id,
          skipNodes,
          runOnlyNodeId
        }
      });
    }

    // Dispatch Inngest Events
    if (eventsToSend.length > 0) {
      await inngest.send(eventsToSend);
    }

    return NextResponse.json({ 
      success: true, 
      count: eventsToSend.length, 
      message: `Re-run triggered successfully for ${eventsToSend.length} execution(s)` 
    });
  } catch (error) {
    console.error("Rerun API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
