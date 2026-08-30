'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    select: { subscriptionTier: true }
  });

  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';

  // Free users cannot enable BYOK True AI Brain
  if (aiRadahnEngineMode === 'byok' && !isPaid) {
    return {
      error: 'AI Radahn True AI Brain (BYOK) is an exclusive feature for Paid subscribers. Please upgrade your plan or use the AI Radahn Native Core Brain.'
    };
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
  return { success: true };
}
