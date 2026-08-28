import { prisma } from '@/lib/prisma';

/**
 * AI Radahn Server-Side Operations & Credit Management
 */

export async function deductUserAiCredit(userId, cost = 1, operation = 'AI_RADAHN_OPERATION') {
  if (!userId) throw new Error('User ID is required');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, aiCredits: true, subscriptionTier: true }
  });

  if (!user) throw new Error('User not found');

  const currentCredits = typeof user.aiCredits === 'number' ? user.aiCredits : 50;

  if (currentCredits < cost) {
    const error = new Error('INSUFFICIENT_CREDITS');
    error.code = 'INSUFFICIENT_CREDITS';
    error.creditsRemaining = currentCredits;
    error.subscriptionTier = user.subscriptionTier;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      aiCredits: { decrement: cost }
    },
    select: { id: true, aiCredits: true }
  });

  return {
    success: true,
    creditsRemaining: updatedUser.aiCredits,
    costDeducted: cost,
    operation
  };
}

export async function getUserAiCredits(userId) {
  if (!userId) return { aiCredits: 0, subscriptionTier: 'free' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiCredits: true, subscriptionTier: true }
  });

  return {
    aiCredits: typeof user?.aiCredits === 'number' ? user.aiCredits : 50,
    subscriptionTier: user?.subscriptionTier || 'free'
  };
}
