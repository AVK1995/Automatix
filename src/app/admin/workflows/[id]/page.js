import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WorkflowInternalClient from './WorkflowInternalClient';

export const dynamic = 'force-dynamic';

export default async function WorkflowInternalPage({ params }) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, name: true, email: true }
      },
      executionLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!workflow) return notFound();

  return <WorkflowInternalClient workflow={workflow} />;
}
