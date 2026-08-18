import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const logs = await prisma.executionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  const workflows = await prisma.workflow.findMany();
  const integrations = await prisma.integration.findMany();
  
  return NextResponse.json({ logs, workflows, integrations });
}
