'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function updatePlatformSettings(data) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const updated = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data }
    });
    
    revalidatePath('/pricing');
    revalidatePath('/admin/settings');
    revalidatePath('/register');
    
    return { success: true, settings: updated };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to update settings.' };
  }
}
