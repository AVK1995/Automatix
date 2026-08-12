import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const wfs = await prisma.workflow.findMany({
      where: { name: 'Alpha Test Automation' }
    });
    return NextResponse.json({ success: true, wfs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
