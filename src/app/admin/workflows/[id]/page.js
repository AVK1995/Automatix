import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WorkflowInternalPage({ params }) {
  const { id } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      client: {
        select: { name: true, email: true }
      },
      executionLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!workflow) return notFound();

  const tableColumns = [
    { header: 'Log ID', accessor: (row) => row.id.substring(0, 8) + '...' },
    { header: 'Ext. Reference', accessor: (row) => row.externalReferenceId || 'N/A' },
    { header: 'Status', accessor: (row) => row.status, isStatus: true },
    { header: 'Internal State', accessor: (row) => <code className="text-xs text-text-secondary bg-background px-2 py-1 rounded-sm border border-border-subtle">{JSON.stringify(row.currentNodeState)}</code> },
    { header: 'Timestamp', accessor: (row) => <span className="text-text-secondary">{new Date(row.createdAt).toLocaleString()}</span> },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <a href="/admin/workflows" className="text-sm text-text-secondary hover:text-foreground">&larr; Back to Workflows</a>
        </div>
        <h2 className="text-xl font-medium text-foreground">{workflow.name}</h2>
        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
          <p>Owner: <span className="text-foreground">{workflow.client?.name}</span> ({workflow.client?.email})</p>
          <span>&bull;</span>
          <p>Status: <span className={workflow.isActive ? 'text-accent-blue font-medium' : 'text-text-secondary'}>{workflow.isActive ? 'Active' : 'Inactive'}</span></p>
          <span>&bull;</span>
          <p>ID: <span className="font-mono text-xs">{workflow.id}</span></p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-medium text-foreground mb-4">Execution Logs</h3>
        <DataTable data={workflow.executionLogs} columns={tableColumns} />
      </div>
    </div>
  );
}
