'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateApiKey } from '@/lib/ai-radahn/keyValidator';

export async function updateProfile({ name, phone, address }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      address
    }
  });

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateAiRadahnSettings({ aiRadahnProvider = 'gemini', aiRadahnApiKey = '', aiRadahnEngineMode = 'native' }) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, aiRadahnApiKey: true }
  });

  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';

  // AI Radahn is strictly for Paid subscribers only
  if (!isPaid) {
    return {
      error: 'AI Radahn Engine is an exclusive feature for Paid subscribers. Please upgrade your plan to unlock AI Radahn.'
    };
  }

  // If BYOK is chosen and a new API key is provided, validate it live!
  if (aiRadahnEngineMode === 'byok') {
    const keyToValidate = (typeof aiRadahnApiKey === 'string' && aiRadahnApiKey.trim())
      ? aiRadahnApiKey.trim()
      : user.aiRadahnApiKey;

    if (!keyToValidate) {
      return {
        error: 'Please enter a valid API key to activate True AI Brain.'
      };
    }

    // Only test if user entered a new key string
    if (typeof aiRadahnApiKey === 'string' && aiRadahnApiKey.trim()) {
      const validation = await validateApiKey(aiRadahnProvider, keyToValidate);
      if (!validation.isValid) {
        return {
          error: `API Key Verification Failed: ${validation.error}`
        };
      }
    }
  }

  const updateData = {
    aiRadahnProvider: aiRadahnProvider || 'gemini',
    aiRadahnEngineMode: aiRadahnEngineMode === 'byok' ? 'byok' : 'native'
  };

  // Only update apiKey if provided (or if user intentionally cleared it)
  if (typeof aiRadahnApiKey === 'string') {
    updateData.aiRadahnApiKey = aiRadahnApiKey.trim() ? aiRadahnApiKey.trim() : null;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData
  });

  revalidatePath('/dashboard/settings');

  if (aiRadahnEngineMode === 'byok') {
    const providerLabel = aiRadahnProvider === 'gemini' ? 'Google Gemini' : aiRadahnProvider === 'openai' ? 'OpenAI' : 'Anthropic Claude';
    return {
      success: true,
      mode: 'byok',
      message: `True AI Brain successfully activated with verified ${providerLabel} credentials.`
    };
  }

  return {
    success: true,
    mode: 'native',
    message: 'AI Radahn Native Core Brain activated. Ready for instant, deterministic generations.'
  };
}

export async function getAiConsumptionLogs(options = {}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { logs: [], summary: { totalCredits: 0, totalTokens: 0, totalEvents: 0 } };
  }

  const { limit = 50, startDate, endDate } = options;

  // Strict 90-Day Retention Enforcement (Nothing older than 90 days is retained or loaded)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Background auto-cleanup of records older than 90 days
  prisma.aiConsumptionLog.deleteMany({
    where: {
      userId: session.user.id,
      createdAt: { lt: ninetyDaysAgo }
    }
  }).catch(() => {});

  const dateFilter = { gte: ninetyDaysAgo };

  if (startDate) {
    const start = new Date(startDate);
    if (start > ninetyDaysAgo) {
      dateFilter.gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const whereClause = {
    userId: session.user.id,
    createdAt: dateFilter
  };

  const logs = await prisma.aiConsumptionLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Calculate summary metrics for the filtered period
  const aggregations = await prisma.aiConsumptionLog.aggregate({
    where: whereClause,
    _sum: {
      creditsUsed: true,
      totalTokens: true
    },
    _count: {
      id: true
    }
  });

  return {
    logs: logs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString()
    })),
    summary: {
      totalCredits: aggregations._sum.creditsUsed || 0,
      totalTokens: aggregations._sum.totalTokens || 0,
      totalEvents: aggregations._count.id || 0
    }
  };
}
