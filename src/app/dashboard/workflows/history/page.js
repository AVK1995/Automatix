import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import HistoryClient from './HistoryClient';

export const metadata = {
  title: 'Workflow History | Automatix',
  description: 'View and manage your workflow execution history.',
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Pre-fetch the list of workflows so the user can filter by them
  const workflows = await prisma.workflow.findMany({
    where: { clientId: session.user.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-full">
      <HistoryClient workflows={workflows} />
    </div>
  );
}
