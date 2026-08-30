import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Reset pending quota requests to CANCELLED or archive them so cooldown is immediately cleared
    const updated = await prisma.quotaRequest.updateMany({
      where: {
        userId: id,
        status: 'PENDING'
      },
      data: {
        status: 'REJECTED' // Clear pending lock so new request can be placed
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Upgrade request cooldown and pending locks cleared successfully.',
      clearedCount: updated.count 
    });
  } catch (error) {
    console.error('Error resetting upgrade request cooldown:', error);
    return NextResponse.json({ error: 'Failed to reset upgrade request cooldown' }, { status: 500 });
  }
}
