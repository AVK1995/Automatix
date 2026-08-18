import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const plans = await prisma.storagePlan.findMany({
      where: { isActive: true },
      orderBy: { priceRs: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Fetch Storage Plans Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
