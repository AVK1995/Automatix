import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import WorkflowBuilder from './WorkflowBuilder';

export default async function WorkflowPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return notFound();
  }

  const { workflowId } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      clientId: session.user.id,
    },
  });

  if (!workflow) {
    return notFound();
  }

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>}>
      <WorkflowBuilder workflow={workflow} />
    </Suspense>
  );
}
