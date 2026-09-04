import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminStorageClient from './AdminStorageClient';

export const dynamic = 'force-dynamic';

export default async function AdminGlobalStoragePage() {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: {
      media: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return <AdminStorageClient users={users} />;
}

