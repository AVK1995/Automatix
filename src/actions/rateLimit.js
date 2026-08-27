import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class RateLimitExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitExceeded';
  }
}

/**
 * Checks if the connection has exceeded its quota, and increments the daily usage.
 * @param {string} integrationId - The ID of the connection being used.
 * @param {string} quotaTier - The user's quota tier (e.g. "free", "premium").
 * @returns {Promise<boolean>} True if allowed, throws RateLimitExceeded if not.
 */
export async function checkAndLogUsage(integrationId, quotaTier = 'free') {
  if (!integrationId) return true; // No integration specified

  // Verify that the integration actually exists in the database to prevent foreign key errors
  const connection = await prisma.integration.findUnique({
    where: { id: integrationId },
    select: { id: true }
  });
  if (!connection) return true;

  // Determine limits based on tier (requests per day)
  const dailyLimit = quotaTier === 'premium' ? 1000 : 200;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Use a Prisma transaction to atomically increment or create
  const usage = await prisma.connectionUsage.upsert({
    where: {
      integrationId_date: {
        integrationId,
        date: today
      }
    },
    update: {
      requestCount: { increment: 1 }
    },
    create: {
      id: crypto.randomUUID(),
      integrationId,
      date: today,
      requestCount: 1,
      updatedAt: new Date()
    }
  });

  if (usage.requestCount > dailyLimit) {
    // Revert the increment if they are over limit (optional, but good practice if we deny)
    await prisma.connectionUsage.update({
      where: { id: usage.id },
      data: { requestCount: { decrement: 1 } }
    });
    throw new RateLimitExceeded(`Quota exceeded. Limit is ${dailyLimit} requests/day.`);
  }

  return true;
}
