import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import WorkflowsClient from './WorkflowsClient';

export const dynamic = 'force-dynamic';

export default async function ClientWorkflows() {
  const session = await auth();

  const [workflows, notifications] = await Promise.all([
    prisma.workflow.findMany({
      where: { clientId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.findMany({
      where: { 
        userId: session.user.id,
        type: 'WORKFLOW_ISSUE',
        status: { in: ['UNREAD', 'IGNORED'] }
      }
    })
  ]);



  return <WorkflowsClient workflows={workflows} notifications={notifications} />;
}
