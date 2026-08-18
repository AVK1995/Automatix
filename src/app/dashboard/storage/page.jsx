import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StorageBucketClient from './StorageBucketClient';

export default async function StorageBucketPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      media: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect('/login');

  return <StorageBucketClient user={user} mediaFiles={user.media} isAdminView={false} />;
}
