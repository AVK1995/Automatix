import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status } = await req.json();
    const ticketId = params.id;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
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

    // Clients can only close tickets
    if (session.user.role !== 'ADMIN' && status !== 'CLOSED') {
      return NextResponse.json({ error: 'Clients can only close tickets' }, { status: 403 });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status }
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error('Update Ticket Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
