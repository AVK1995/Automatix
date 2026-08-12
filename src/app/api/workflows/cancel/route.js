import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SYSTEM_STATUS } from "@/constants";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { executionLogId } = body;

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

    if (executionLog.workflow.clientId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (executionLog.status !== SYSTEM_STATUS.ACTIVE) {
      return NextResponse.json({ error: "Execution is not active" }, { status: 400 });
    }

    // Set status to CANCELLED. The Kill Switch inside the Inngest function will catch this
    // and abort the execution before the next ACTION node runs.
    await prisma.executionLog.update({
      where: { id: executionLogId },
      data: { status: SYSTEM_STATUS.CANCELLED }
    });

    return NextResponse.json({ success: true, message: "Execution cancelled" });
  } catch (error) {
    console.error("Cancel API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
