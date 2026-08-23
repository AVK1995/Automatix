import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Fetch Tickets Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Fetch user to check quotas
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Check if they are currently in a cooldown period
    if (user.ticketQuotaResetAt && now < new Date(user.ticketQuotaResetAt)) {
      const hoursLeft = Math.ceil((new Date(user.ticketQuotaResetAt) - now) / (1000 * 60 * 60));
      return NextResponse.json({ 
        error: `You have reached your support ticket limit. Please wait ${hoursLeft} hour(s) before creating a new ticket.` 
      }, { status: 429 });
    }

    // If cooldown has passed, they should have tickets. But let's check remaining just in case
    // If ticketQuotaResetAt is in the past, and remaining is 0, we should replenish it!
    let remaining = user.supportTicketsRemaining;
    let newResetAt = user.ticketQuotaResetAt;

    if (newResetAt && now >= new Date(newResetAt)) {
      remaining = user.maxSupportTickets;
      newResetAt = null;
    }

    if (remaining <= 0) {
      return NextResponse.json({ error: 'No support tickets remaining' }, { status: 429 });
    }

    // Decrement tickets
    remaining -= 1;

    // If they hit 0, set the cooldown reset time
    if (remaining === 0) {
      newResetAt = new Date(now.getTime() + (user.ticketCooldownHours * 60 * 60 * 1000));
    }

    // Create ticket and message atomically, and update user
    const [ticket] = await prisma.$transaction([
      prisma.supportTicket.create({
        data: {
          userId: user.id,
          type: type || 'GENERAL',
          subject,
          message,
          messages: {
            create: {
              senderId: user.id,
              content: message
            }
          }
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          supportTicketsRemaining: remaining,
          ticketQuotaResetAt: newResetAt
        }
      })
    ]);

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Create Ticket Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
