import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Delete all execution logs
    await prisma.executionLog.deleteMany({});
    return NextResponse.json({ success: true, message: "Cleaned all execution logs." });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
