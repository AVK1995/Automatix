import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import ProvisionForm from './ProvisionForm';

export const dynamic = 'force-dynamic';

export default async function TenantProvisioningPage() {
  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: {
      _count: {
        select: { workflows: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const tableColumns = [
    { header: 'Tenant Name', accessor: (row) => row.name || 'Pending Setup' },
    { header: 'Email Address', accessor: (row) => row.email },
    { header: 'Subscription', accessor: (row) => row.subscriptionTier },
    { header: 'Workflows', accessor: (row) => `${row._count.workflows} Built` },
    { header: 'Joined At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <ProvisionForm />
      
      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">All Provisioned Tenants</h2>
        <DataTable data={users} columns={tableColumns} />
      </div>
    </div>
  );
}
