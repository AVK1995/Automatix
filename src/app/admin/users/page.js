import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import ProvisionForm from './ProvisionForm';
import Link from 'next/link';

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
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
            {row.subscriptionTier} [{row.subscriptionCycle}]
          </span>
          {row.subscriptionExpiresAt && (
            <div className="text-[10px] text-text-secondary mt-1">
              Expires: {new Date(row.subscriptionExpiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Workflows', 
      accessor: (row) => (
        <Link 
          href={`/admin/workflows?tenantId=${row.id}`} 
          className="text-accent-blue hover:text-accent-blue/80 underline underline-offset-2 font-medium"
        >
          {row._count.workflows} Built &rarr;
        </Link>
      ) 
    },
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
