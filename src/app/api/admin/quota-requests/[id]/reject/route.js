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
    const { reason } = await req.json().catch(() => ({ reason: 'Your request was reviewed and rejected.' }));

    const request = await prisma.quotaRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    // Notify the user about the rejection
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: request.userId,
        type: 'STORAGE_QUOTA',
        message: `Your storage quota upgrade request has been rejected. Reason: ${reason}`,
        status: 'UNREAD',
        metadata: {
          icon: 'AlertTriangle',
          color: 'red'
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error('Reject Quota Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
