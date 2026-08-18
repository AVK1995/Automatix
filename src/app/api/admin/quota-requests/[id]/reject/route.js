import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const request = await prisma.quotaRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Reject Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
