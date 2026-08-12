import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';
import SearchInput from '@/components/SearchInput';
import AdminWorkflowsClient from './AdminWorkflowsClient';

export const dynamic = 'force-dynamic';

export default async function AdminWorkflowsPage({ searchParams }) {
  const params = await searchParams;
  const tenantIdFilter = params?.tenantId;
  const q = params?.q || '';

  const whereClause = {
    ...(tenantIdFilter ? { clientId: tenantIdFilter } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
  };

  const workflows = await prisma.workflow.findMany({
    where: whereClause,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group workflows by tenant
  const groupedWorkflows = workflows.reduce((acc, workflow) => {
    const tenantName = workflow.client?.name || workflow.client?.email || 'Unknown Tenant';
    if (!acc[tenantName]) {
      acc[tenantName] = {
        client: workflow.client,
        workflows: []
      };
    }
    acc[tenantName].workflows.push(workflow);
    return acc;
  }, {});

  return (
    <AdminWorkflowsClient 
      groupedWorkflows={groupedWorkflows} 
      tenantIdFilter={tenantIdFilter} 
    />
  );
}
