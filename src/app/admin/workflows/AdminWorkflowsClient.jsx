'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';
import { Trash2 } from 'lucide-react';
import { deleteWorkflow } from '@/actions/workflows';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminWorkflowsClient({ groupedWorkflows, tenantIdFilter }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const executeBulkDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteWorkflow(id);
      }
      setSelectedIds([]);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const getTableColumns = (workflowsInGroup) => [
    { 
      header: (
        <Checkbox 
          checked={workflowsInGroup.length > 0 && workflowsInGroup.every(w => selectedIds.includes(w.id))}
          onChange={(e) => {
            if (e.target.checked) {
              const newIds = new Set(selectedIds);
              workflowsInGroup.forEach(w => newIds.add(w.id));
              setSelectedIds(Array.from(newIds));
            } else {
              const groupIds = new Set(workflowsInGroup.map(w => w.id));
              setSelectedIds(selectedIds.filter(id => !groupIds.has(id)));
            }
          }}
        />
      ),
      className: 'w-[40px] pl-4',
      accessor: (row) => (
        <Checkbox 
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds([...selectedIds, row.id]);
            else setSelectedIds(selectedIds.filter(id => id !== row.id));
          }}
        />
      )
    },
    { 
      header: 'Workflow', 
      className: 'w-[45%]',
      accessor: (row) => (
        <Link href={`/admin/workflows/${row.id}`} className="block group text-left min-w-0 max-w-[200px] sm:max-w-[300px]">
          <div className="font-semibold text-foreground group-hover:text-accent-blue transition-colors truncate" title={row.name}>{row.name}</div>
          <div className="text-xs text-text-secondary mt-0.5 font-mono group-hover:text-accent-blue/70 transition-colors truncate">ID: {row.id.substring(0, 8)}...</div>
        </Link>
      )
    },
    { header: 'Status', className: 'w-[15%]', accessor: (row) => row.isActive ? 'ACTIVE' : 'INACTIVE', isStatus: true },
    { header: 'Created', className: 'w-[20%]', accessor: (row) => <span className="text-sm text-text-secondary">{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
    { 
      header: 'Actions', 
      className: 'w-[20%] text-center',
      accessor: (row) => (
        <div className="flex justify-center items-center">
          <a 
            href={`/admin/workflows/${row.id}`} 
            className="group inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border-subtle hover:bg-border-subtle hover:text-foreground text-text-secondary transition-colors"
          >
            View Logs
          </a>
        </div>
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
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
            </button>
          )}
          <SearchInput placeholder="Search workflows by name..." />
        </div>
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
                <Link href={`/admin/users/${group.client?.id}`} className="block group">
                  <h3 className="font-medium text-foreground text-sm group-hover:text-accent-blue transition-colors">{tenantName}</h3>
                  <p className="text-[10px] text-text-secondary mt-0.5 group-hover:text-accent-blue/70 transition-colors">{group.client?.email}</p>
                </Link>
                <div className="text-xs font-medium bg-border-subtle px-2 py-1 rounded-full text-text-secondary">
                  {group.workflows.length} Workflow{group.workflows.length !== 1 && 's'}
                </div>
              </div>
              <DataTable data={group.workflows} columns={getTableColumns(group.workflows)} />
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeBulkDelete}
        title="Delete Workflows"
        message={`Are you sure you want to delete ${selectedIds.length} workflow(s)? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
