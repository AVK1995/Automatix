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

// Helper to parse stored keys JSON safely
function parseStoredKeys(apiKeyField, defaultProvider = 'gemini') {
  if (!apiKeyField) return [];
  try {
    const parsed = JSON.parse(apiKeyField);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Plain string fallback
  }
  if (typeof apiKeyField === 'string' && apiKeyField.trim()) {
    return [{
      id: 'legacy_primary',
      name: 'Primary Key',
      provider: defaultProvider || 'gemini',
      apiKey: apiKeyField.trim(),
      isDefault: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }];
  }
  return [];
}

export async function getAiRadahnKeys() {
  const session = await auth();
  if (!session?.user?.id) {
    return { keys: [], isPaid: false, engineMode: 'native' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, aiRadahnApiKey: true, aiRadahnProvider: true, aiRadahnEngineMode: true }
  });

  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
  const keys = parseStoredKeys(user?.aiRadahnApiKey, user?.aiRadahnProvider);

  const safeKeys = keys.map(k => {
    const raw = k.apiKey || '';
    const masked = raw.length > 8 
      ? `${raw.slice(0, 4)}••••••••••••${raw.slice(-4)}`
      : '••••••••••••';
    return {
      ...k,
      maskedKey: masked
    };
  });

  return {
    keys: safeKeys,
    isPaid,
    engineMode: user?.aiRadahnEngineMode || 'native',
    defaultProvider: user?.aiRadahnProvider || 'gemini'
  };
}

export async function saveAiRadahnKey({ id, name, provider = 'gemini', apiKey = '', isDefault = false }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, aiRadahnApiKey: true, aiRadahnProvider: true }
  });

  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
  if (!isPaid) {
    return {
      error: 'AI Radahn Multi-Key Management is exclusively available for Paid subscribers. Please upgrade.'
    };
  }

  if (!apiKey || !apiKey.trim()) {
    return { error: 'Please enter a valid API key string.' };
  }

  const cleanKey = apiKey.trim();
  const targetProvider = (provider || 'gemini').toLowerCase();
  const existingKeys = parseStoredKeys(user?.aiRadahnApiKey, user?.aiRadahnProvider);

  // Check 3-key limit per provider
  const providerCount = existingKeys.filter(k => k.provider === targetProvider && k.id !== id).length;
  if (providerCount >= 3) {
    const providerLabel = targetProvider === 'gemini' ? 'Google Gemini' : targetProvider === 'openai' ? 'OpenAI' : 'Anthropic Claude';
    return {
      error: `Maximum 3 keys allowed for ${providerLabel}. You already have 3 keys configured. Please delete an older key first.`
    };
  }

  // Live validate the key
  const validation = await validateApiKey(targetProvider, cleanKey);
  if (!validation.isValid) {
    return {
      error: `Key Verification Failed: ${validation.error || 'Invalid API credentials.'}`
    };
  }

  const keyId = id || `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const keyName = name && name.trim() ? name.trim() : `${targetProvider.toUpperCase()} Key ${providerCount + 1}`;

  let updatedKeys;
  if (id) {
    // Update existing key
    updatedKeys = existingKeys.map(k => {
      if (k.id === id) {
        return {
          ...k,
          name: keyName,
          provider: targetProvider,
          apiKey: cleanKey,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        };
      }
      return isDefault ? { ...k, isDefault: false } : k;
    });
  } else {
    // Append new key
    if (isDefault || existingKeys.length === 0) {
      existingKeys.forEach(k => { k.isDefault = false; });
    }
    const newKeyObj = {
      id: keyId,
      name: keyName,
      provider: targetProvider,
      apiKey: cleanKey,
      isDefault: isDefault || existingKeys.length === 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    updatedKeys = [...existingKeys, newKeyObj];
  }

  // Set user default provider if needed
  const defaultKey = updatedKeys.find(k => k.isDefault) || updatedKeys[0];

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      aiRadahnApiKey: JSON.stringify(updatedKeys),
      aiRadahnProvider: defaultKey ? defaultKey.provider : targetProvider,
      aiRadahnEngineMode: 'byok'
    }
  });

  revalidatePath('/dashboard/settings');

  return {
    success: true,
    message: `API Key "${keyName}" verified and saved to AI Radahn Key Vault!`,
    keyId
  };
}

export async function deleteAiRadahnKey(keyId) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiRadahnApiKey: true, aiRadahnProvider: true }
  });

  const existingKeys = parseStoredKeys(user?.aiRadahnApiKey, user?.aiRadahnProvider);
  const updatedKeys = existingKeys.filter(k => k.id !== keyId);

  // If deleted key was default, assign next available
  if (updatedKeys.length > 0 && !updatedKeys.some(k => k.isDefault)) {
    updatedKeys[0].isDefault = true;
  }

  const defaultKey = updatedKeys.find(k => k.isDefault) || null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      aiRadahnApiKey: updatedKeys.length > 0 ? JSON.stringify(updatedKeys) : null,
      aiRadahnProvider: defaultKey ? defaultKey.provider : 'gemini',
      aiRadahnEngineMode: updatedKeys.length > 0 ? 'byok' : 'native'
    }
  });

  revalidatePath('/dashboard/settings');
  return { success: true, message: 'Key removed from AI Radahn Key Vault.' };
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

  if (!isPaid) {
    return {
      error: 'AI Radahn Engine is an exclusive feature for Paid subscribers. Please upgrade your plan to unlock AI Radahn.'
    };
  }

  const updateData = {
    aiRadahnProvider: aiRadahnProvider || 'gemini',
    aiRadahnEngineMode: aiRadahnEngineMode === 'byok' ? 'byok' : 'native'
  };

  // If user entered a new key directly, parse or add to vault
  if (typeof aiRadahnApiKey === 'string' && aiRadahnApiKey.trim()) {
    const existingKeys = parseStoredKeys(user?.aiRadahnApiKey, aiRadahnProvider);
    const validation = await validateApiKey(aiRadahnProvider, aiRadahnApiKey.trim());
    if (!validation.isValid) {
      return { error: `API Key Verification Failed: ${validation.error}` };
    }

    const newKeyObj = {
      id: `key_${Date.now()}`,
      name: `${aiRadahnProvider.toUpperCase()} Key`,
      provider: aiRadahnProvider,
      apiKey: aiRadahnApiKey.trim(),
      isDefault: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    existingKeys.forEach(k => { k.isDefault = false; });
    updateData.aiRadahnApiKey = JSON.stringify([...existingKeys, newKeyObj]);
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
      message: `True AI Brain successfully activated with ${providerLabel} credentials.`
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

  const { limit = 100, startDate, endDate, keyName, provider } = options;

  // Strict 90-Day Retention Enforcement
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

  if (provider && provider !== 'all') {
    whereClause.provider = provider;
  }

  const logs = await prisma.aiConsumptionLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Filter in-memory by keyName if provided in log metadata
  let filteredLogs = logs;
  if (keyName && keyName !== 'all') {
    filteredLogs = logs.filter(l => {
      const meta = l.metadata || {};
      return meta.keyName === keyName || meta.keyId === keyName || l.provider === keyName;
    });
  }

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
    logs: filteredLogs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString()
    })),
    summary: {
      totalCredits: aggregations._sum.creditsUsed || 0,
      totalTokens: aggregations._sum.totalTokens || 0,
      totalEvents: filteredLogs.length
    }
  };
}
