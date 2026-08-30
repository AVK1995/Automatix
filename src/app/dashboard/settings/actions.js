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

  // Free users cannot enable BYOK True AI Brain
  if (aiRadahnEngineMode === 'byok' && !isPaid) {
    return {
      error: 'AI Radahn True AI Brain (BYOK) is an exclusive feature for Paid subscribers. Please upgrade your plan or use the AI Radahn Native Core Brain.'
    };
  }

  // If BYOK is chosen and a new API key is provided, validate it live!
  if (aiRadahnEngineMode === 'byok' && isPaid) {
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
    aiRadahnEngineMode: (isPaid && aiRadahnEngineMode === 'byok') ? 'byok' : 'native'
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

  if (aiRadahnEngineMode === 'byok' && isPaid) {
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
    message: 'AI Radahn Native Core Brain activated. Ready for instant, deterministic zero-key generations.'
  };
}

export async function getAiConsumptionLogs(limit = 20) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { logs: [], summary: { totalCredits: 0, totalTokens: 0, totalEvents: 0 } };
  }

  const logs = await prisma.aiConsumptionLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Calculate summary metrics
  const aggregations = await prisma.aiConsumptionLog.aggregate({
    where: { userId: session.user.id },
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
