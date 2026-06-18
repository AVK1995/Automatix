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
    { 
      header: 'Tenant / Email', 
      accessor: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name || 'Pending Setup'}</div>
          <div className="text-xs text-text-secondary mt-0.5">{row.email}</div>
        </div>
      )
    },
    { 
      header: 'Subscription', 
      accessor: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
          {row.subscriptionTier}
        </span>
      )
    },
    { header: 'Workflows', accessor: (row) => <span className="text-foreground">{row._count.workflows} Built</span> },
    { header: 'Joined At', accessor: (row) => <span className="text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span> },
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
