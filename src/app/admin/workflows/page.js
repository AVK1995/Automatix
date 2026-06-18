import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';

export const dynamic = 'force-dynamic';

export default async function AdminWorkflowsPage() {
  const workflows = await prisma.workflow.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const tableColumns = [
    { 
      header: 'Workflow', 
      accessor: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-xs text-text-secondary mt-0.5 font-mono">ID: {row.id.substring(0, 8)}...</div>
        </div>
      )
    },
    { 
      header: 'Owner', 
      accessor: (row) => (
        <div>
          <div className="text-sm text-foreground">{row.client?.name || 'Unknown'}</div>
          <div className="text-xs text-text-secondary">{row.client?.email || 'N/A'}</div>
        </div>
      )
    },
    { header: 'Status', accessor: (row) => row.isActive ? 'ACTIVE' : 'INACTIVE', isStatus: true },
    { header: 'Created', accessor: (row) => <span className="text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { 
      header: 'Actions', 
      accessor: (row) => (
        <a 
          href={`/admin/workflows/${row.id}`} 
          className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 underline underline-offset-2"
        >
          View Logs &rarr;
        </a>
      ) 
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-lg font-medium text-foreground mb-2">All Tenant Workflows</h2>
        <p className="text-sm text-text-secondary">A global view of all workflows created by all tenants in the system.</p>
      </div>
      
      <DataTable data={workflows} columns={tableColumns} />
    </div>
  );
}
