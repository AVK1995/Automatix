import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await req.json();
    const resolvedParams = await params;
    const ticketId = resolvedParams?.id;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control
    if (session.user.role !== 'ADMIN' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If ticket is closed, don't allow clients to send messages
    if (session.user.role !== 'ADMIN' && ticket.status === 'CLOSED') {
      return NextResponse.json({ error: 'This ticket has been closed. Please open a new ticket.' }, { status: 400 });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: session.user.id,
        content: content.trim()
      }
    });

    // Update ticket's updatedAt timestamp and status if open
    const updateData = { updatedAt: new Date() };
    if (session.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS';
    }
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    });

    // If admin replied, send client notification
    if (session.user.role === 'ADMIN') {
      await prisma.notification.create({
        data: {
          id: `support-reply-${ticketId}-${Date.now()}`,
          userId: ticket.userId,
          type: 'SUPPORT_REPLY',
          message: `Administrator replied on "${ticket.subject}": "${content.trim().slice(0, 80)}"`,
          metadata: {
            ticketId: ticket.id,
            ticketSubject: ticket.subject,
            content: content.trim(),
            targetUrl: `/dashboard/support?ticketId=${ticket.id}`
          },
          status: 'UNREAD',
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Add Ticket Message Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
