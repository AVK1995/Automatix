'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function submitRefundRequest(subject, message) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized. Please login to submit a refund request.' };
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        type: 'REFUND',
        subject,
        message,
        status: 'OPEN',
      }
    });

    // You could also trigger an email to the admin here if needed,
    // but the dashboard notification is standard for now.

    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error('Error submitting refund request:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}
