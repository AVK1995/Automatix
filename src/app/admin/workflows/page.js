import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';

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
    { header: 'Created', accessor: (row) => <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString()}</span> },
    { 
      header: 'Actions', 
      accessor: (row) => (
        <a 
          href={`/admin/workflows/${row.id}`} 
          className="group inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border-subtle hover:bg-border-subtle hover:text-foreground text-text-secondary transition-colors"
        >
          View Logs
          <svg className="ml-1.5 w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      ) 
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-foreground mb-2">
            {tenantIdFilter ? 'Tenant Workflows' : 'All Tenant Workflows'}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-secondary">
              {tenantIdFilter 
                ? 'Viewing workflows for a specific tenant.' 
                : 'A global view of all workflows created by all tenants in the system.'}
            </p>
            {tenantIdFilter && (
              <Link href="/admin/workflows" className="text-xs font-medium px-2 py-1 bg-accent-blue/10 text-accent-blue rounded-md hover:bg-accent-blue/20">
                Clear Filter &times;
              </Link>
            )}
          </div>
        </div>
        <SearchInput placeholder="Search workflows by name..." />
      </div>
      
      {Object.keys(groupedWorkflows).length === 0 ? (
        <div className="w-full border border-border-subtle rounded-sm bg-card p-8 text-center text-sm text-text-secondary">
          No workflows found.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedWorkflows).map(([tenantName, group]) => (
            <div key={tenantName} className="border border-border-subtle rounded-sm bg-card overflow-hidden shadow-sm">
              <div className="bg-background border-b border-border-subtle px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground text-sm">{tenantName}</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5">{group.client?.email}</p>
                </div>
                <div className="text-xs font-medium bg-border-subtle px-2 py-1 rounded-full text-text-secondary">
                  {group.workflows.length} Workflow{group.workflows.length !== 1 && 's'}
                </div>
              </div>
              <DataTable data={group.workflows} columns={tableColumns} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
