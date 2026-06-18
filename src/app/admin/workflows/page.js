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
    { header: 'Workflow ID', accessor: (row) => row.id.substring(0, 8) + '...' },
    { header: 'Workflow Name', accessor: (row) => row.name },
    { header: 'Tenant', accessor: (row) => row.client?.name || row.client?.email },
    { header: 'Active Status', accessor: (row) => row.isActive ? 'ACTIVE' : 'INACTIVE', isStatus: true },
    { header: 'Created At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
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
