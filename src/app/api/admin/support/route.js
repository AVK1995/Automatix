import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, userEmail, subject, message } = await request.json();

    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      const u = await prisma.user.findUnique({ where: { email: userEmail } });
      if (u) targetUserId = u.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Valid user is required' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const ticketSubject = subject?.trim() || 'Direct Support Conversation';

    // Create the ticket with IN_PROGRESS status and the first message from admin
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: targetUserId,
        type: 'GENERAL',
        subject: ticketSubject,
        message: message.trim(),
        status: 'IN_PROGRESS',
        messages: {
          create: {
            senderId: session.user.id,
            content: message.trim()
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create a direct notification for the client
    await prisma.notification.create({
      data: {
        id: `support-direct-${ticket.id}-${Date.now()}`,
        userId: targetUserId,
        type: 'SUPPORT_REPLY',
        message: `Administrator initiated a conversation: "${ticketSubject}" - ${message.trim().slice(0, 80)}`,
        metadata: {
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          content: message.trim(),
          targetUrl: `/dashboard/support?ticketId=${ticket.id}`
        },
        status: 'UNREAD',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Error creating admin direct conversation:', error);
    return NextResponse.json({ error: 'Failed to initiate conversation' }, { status: 500 });
  }
}
