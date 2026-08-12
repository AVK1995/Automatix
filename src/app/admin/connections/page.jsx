import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DataTable from '@/components/DataTable';
import DeleteButton from '@/components/DeleteButton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminConnectionsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const q = params?.q || '';

  const whereClause = q ? {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { accountEmail: { contains: q, mode: 'insensitive' } },
      { providerName: { contains: q, mode: 'insensitive' } },
      { client: { email: { contains: q, mode: 'insensitive' } } }
    ]
  } : {};

  const connections = await prisma.integration.findMany({
    where: whereClause,
    include: {
      client: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const tableColumns = [
    { 
      header: 'Connection / Provider', 
      className: 'w-[25%]',
      accessor: (row) => (
        <div className="block">
          <div className="font-semibold text-foreground">{row.name || 'Unnamed Connection'}</div>
          <div className="text-xs text-accent-blue mt-0.5 uppercase tracking-wider">{row.providerName}</div>
        </div>
      )
    },
    { 
      header: 'Tenant / Owner', 
      className: 'w-[25%]',
      accessor: (row) => (
        <Link href={`/admin/users/${row.client.id}`} className="block group">
          <div className="text-sm text-foreground group-hover:text-accent-blue transition-colors">{row.client.name || 'Unknown'}</div>
          <div className="text-xs text-text-secondary mt-0.5 group-hover:text-accent-blue/70 transition-colors">{row.client.email}</div>
        </Link>
      )
    },
    { 
      header: 'Account Email', 
      className: 'w-[20%]',
      accessor: (row) => (
        <span className="text-xs text-text-secondary">{row.accountEmail || 'N/A'}</span>
      )
    },
    { 
      header: 'Created At', 
      className: 'w-[15%]',
      accessor: (row) => (
        <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      ) 
    },
    { 
      header: 'Actions', 
      className: 'w-[15%] text-center',
      accessor: (row) => (
        <div className="flex justify-center items-center">
          <DeleteButton 
            id={row.id} 
            type="connection" 
            confirmMessage={`Are you sure you want to completely delete the ${row.providerName} connection "${row.name}" owned by ${row.client.email}? Any workflows using this connection will fail.`} 
          />
        </div>
      ) 
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Global Connections</h1>
        <p className="text-text-secondary text-sm">Monitor and manage third-party integrations across all tenants.</p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-white mb-4">All Provisioned Connections</h2>
        <DataTable 
          data={connections} 
          columns={tableColumns}
          emptyMessage="No connections found."
          searchPlaceholder="Search by name, email, or provider..."
        />
      </div>
    </div>
  );
}
