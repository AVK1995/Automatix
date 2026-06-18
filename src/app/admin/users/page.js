import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import ProvisionForm from './ProvisionForm';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';

export const dynamic = 'force-dynamic';

export default async function TenantProvisioningPage({ searchParams }) {
  const params = await searchParams;
  const q = params?.q || '';

  const whereClause = {
    role: 'CLIENT',
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    } : {})
  };

  const users = await prisma.user.findMany({
    where: whereClause,
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
      className: 'w-[30%]',
      accessor: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name || 'Pending Setup'}</div>
          <div className="text-xs text-text-secondary mt-0.5">{row.email}</div>
        </div>
      )
    },
    { 
      header: 'Subscription', 
      className: 'w-[20%]',
      accessor: (row) => (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
            {row.subscriptionTier} [{row.subscriptionCycle || 'monthly'}]
          </span>
          {row.subscriptionExpiresAt && (
            <div className="text-[10px] text-text-secondary mt-1.5 font-medium">
              Expires: {new Date(row.subscriptionExpiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Workflows', 
      className: 'w-[15%]',
      accessor: (row) => (
        <Link 
          href={`/admin/workflows?tenantId=${row.id}`} 
          className="group inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white transition-all shadow-sm"
        >
          {row._count.workflows} Built
          <svg className="ml-1.5 w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      ) 
    },
    { header: 'Joined At', className: 'w-[15%]', accessor: (row) => <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { 
      header: 'Actions', 
      className: 'w-[20%] text-right',
      accessor: (row) => (
        <div className="flex justify-end">
          <Link 
            href={`/admin/users/${row.id}`} 
            className="group inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border-subtle hover:bg-border-subtle hover:text-foreground text-text-secondary transition-colors"
          >
            Manage
            <svg className="ml-1.5 w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      ) 
    },
  ];

  return (
    <div>
      <ProvisionForm />
      
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-medium text-foreground">All Provisioned Tenants</h2>
          <SearchInput placeholder="Search by name or email..." />
        </div>
        <DataTable data={users} columns={tableColumns} />
      </div>
    </div>
  );
}
