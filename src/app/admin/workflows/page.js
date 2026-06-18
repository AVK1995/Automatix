import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminWorkflowsPage({ searchParams }) {
  const params = await searchParams;
  const tenantIdFilter = params?.tenantId;

  const whereClause = tenantIdFilter ? { clientId: tenantIdFilter } : {};

  const workflows = await prisma.workflow.findMany({
    where: whereClause,
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground mb-2">
            {tenantIdFilter ? 'Tenant Workflows' : 'All Tenant Workflows'}
          </h2>
          <p className="text-sm text-text-secondary">
            {tenantIdFilter 
              ? 'Viewing workflows for a specific tenant.' 
              : 'A global view of all workflows created by all tenants in the system.'}
          </p>
        </div>
        {tenantIdFilter && (
          <Link href="/admin/workflows" className="text-sm text-accent-blue hover:underline">
            Clear Filter &times;
          </Link>
        )}
      </div>
      
      {Object.keys(groupedWorkflows).length === 0 ? (
        <div className="w-full border border-border-subtle rounded-sm bg-card p-8 text-center text-sm text-text-secondary">
          No workflows found.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedWorkflows).map(([tenantName, group]) => (
            <div key={tenantName} className="border border-border-subtle rounded-sm bg-card overflow-hidden">
              <div className="bg-background border-b border-border-subtle px-4 py-3">
                <h3 className="font-medium text-foreground">{tenantName}</h3>
                <p className="text-xs text-text-secondary">{group.client?.email}</p>
              </div>
              <DataTable data={group.workflows} columns={tableColumns} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
