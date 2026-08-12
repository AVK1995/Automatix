import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { providerName, apiKey } = await request.json();

    if (!providerName || !apiKey) {
      return NextResponse.json({ error: 'Provider and API Key are required' }, { status: 400 });
    }

    // Upsert to handle unique constraint (clientId, providerName)
    const connection = await prisma.integration.upsert({
      where: {
        clientId_providerName: {
          clientId: session.user.id,
          providerName
        }
      },
      update: { apiKey },
      create: {
        clientId: session.user.id,
        providerName,
        apiKey
      }
    });

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('Add connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
