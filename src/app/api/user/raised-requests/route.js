import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [quotaRequests, tickets] = await Promise.all([
      prisma.quotaRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })
    ]);

    const conciergeRequests = tickets.filter(t => t.subject?.startsWith('Concierge Setup'));
    const refundRequests = tickets.filter(t => t.type === 'REFUND');
    const supportTickets = tickets.filter(t => t.type !== 'REFUND' && !t.subject?.startsWith('Concierge Setup'));

    return NextResponse.json({
      quotaRequests,
      conciergeRequests,
      refundRequests,
      supportTickets
    });
  } catch (error) {
    console.error('Raised Requests API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
