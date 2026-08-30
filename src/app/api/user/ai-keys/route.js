import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscriptionTier: true,
        aiRadahnProvider: true,
        aiRadahnApiKey: true,
        aiRadahnEngineMode: true
      }
    });

    const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
    let keys = [];

    if (user?.aiRadahnApiKey) {
      try {
        const parsed = JSON.parse(user.aiRadahnApiKey);
        if (Array.isArray(parsed)) {
          keys = parsed;
        }
      } catch (e) {
        if (typeof user.aiRadahnApiKey === 'string' && user.aiRadahnApiKey.trim()) {
          keys = [{
            id: 'legacy_primary',
            name: 'Primary Key',
            provider: user.aiRadahnProvider || 'gemini',
            apiKey: user.aiRadahnApiKey.trim(),
            isDefault: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          }];
        }
      }
    }

    // Mask API keys for safe client transfer
    const safeKeys = keys.map(k => {
      const raw = k.apiKey || '';
      const masked = raw.length > 8 
        ? `${raw.slice(0, 4)}••••••••••••${raw.slice(-4)}`
        : '••••••••••••';
      return {
        ...k,
        apiKey: masked,
        hasKey: Boolean(raw)
      };
    });

    return NextResponse.json({
      isPaid,
      engineMode: user?.aiRadahnEngineMode || 'native',
      provider: user?.aiRadahnProvider || 'gemini',
      keys: safeKeys
    });
  } catch (error) {
    console.error('Failed to fetch AI keys:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
