'use client';

import { useState, useMemo } from 'react';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import { Trash2, Filter, Search, RotateCcw, X, CheckSquare, Calendar, Activity } from 'lucide-react';
import { deleteWorkflow } from '@/actions/workflows';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TruncatedText from '@/components/ui/TruncatedText';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

export default function AdminWorkflowsClient({ groupedWorkflows = {}, tenantIdFilter }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS'
  const [selectedTenant, setSelectedTenant] = useState('ALL'); // 'ALL' | tenantId

  // Extract all unique tenants for the tenant filter dropdown
  const tenantOptions = useMemo(() => {
    const list = [{ value: 'ALL', label: 'All Tenants' }];
    Object.entries(groupedWorkflows).forEach(([name, group]) => {
      if (group.client?.id) {
        list.push({
          value: group.client.id,
          label: `${name} (${group.client.email || 'N/A'})`
        });
      }
    });
    return list;
  }, [groupedWorkflows]);

  // Filter grouped workflows dynamically
  const filteredGroupedWorkflows = useMemo(() => {
    const result = {};
    const now = Date.now();

    Object.entries(groupedWorkflows).forEach(([tenantName, group]) => {
      if (selectedTenant !== 'ALL' && group.client?.id !== selectedTenant) return;

      const matchingWorkflows = (group.workflows || []).filter((workflow) => {
        // Status filter
        if (statusFilter === 'ACTIVE' && !workflow.isActive) return false;
        if (statusFilter === 'INACTIVE' && workflow.isActive) return false;

        // Date range filter
        if (dateRange !== 'ALL') {
          const createdMs = new Date(workflow.createdAt).getTime();
          const ageDays = (now - createdMs) / (1000 * 60 * 60 * 24);
          if (dateRange === 'TODAY' && ageDays > 1) return false;
          if (dateRange === 'LAST_7_DAYS' && ageDays > 7) return false;
          if (dateRange === 'LAST_30_DAYS' && ageDays > 30) return false;
          if (dateRange === 'LAST_90_DAYS' && ageDays > 90) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (workflow.name || '').toLowerCase().includes(q);
          const matchId = (workflow.id || '').toLowerCase().includes(q);
          if (!matchName && !matchId) return false;
        }

        return true;
      });

      if (matchingWorkflows.length > 0) {
        result[tenantName] = {
          ...group,
          workflows: matchingWorkflows
        };
      }
    });

    return result;
  }, [groupedWorkflows, selectedTenant, statusFilter, dateRange, searchQuery]);

  // Calculate totals
  const allFilteredWorkflowIds = useMemo(() => {
    const ids = [];
    Object.values(filteredGroupedWorkflows).forEach(group => {
      (group.workflows || []).forEach(w => ids.push(w.id));
    });
    return ids;
  }, [filteredGroupedWorkflows]);

  const totalRawWorkflows = useMemo(() => {
    let count = 0;
    Object.values(groupedWorkflows).forEach(group => {
      count += (group.workflows || []).length;
    });
    return count;
  }, [groupedWorkflows]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || dateRange !== 'ALL' || selectedTenant !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDateRange('ALL');
    setSelectedTenant('ALL');
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(allFilteredWorkflowIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const executeBulkDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteWorkflow(id);
      }
      toast.success(`Successfully deleted ${selectedIds.length} workflow(s)`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to delete selected workflows');
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const getTableColumns = (workflowsInGroup) => {
    const groupWorkflowIds = workflowsInGroup.map(w => w.id);
    const allInGroupSelected = groupWorkflowIds.length > 0 && groupWorkflowIds.every(id => selectedIds.includes(id));
    const someInGroupSelected = groupWorkflowIds.some(id => selectedIds.includes(id)) && !allInGroupSelected;

    return [
      { 
        header: (
          <div className="flex items-center justify-center">
            <Checkbox 
              checked={allInGroupSelected}
              indeterminate={someInGroupSelected}
              onChange={(checked) => {
                const isChecked = typeof checked === 'boolean' ? checked : !!checked?.target?.checked;
                if (isChecked) {
                  setSelectedIds(prev => Array.from(new Set([...prev, ...groupWorkflowIds])));
                } else {
                  const groupSet = new Set(groupWorkflowIds);
                  setSelectedIds(prev => prev.filter(id => !groupSet.has(id)));
                }
              }}
            />
          </div>
        ),
        className: 'w-[48px] px-3',
        accessor: (row) => (
          <div className="flex items-center justify-center">
            <Checkbox 
              checked={selectedIds.includes(row.id)}
              onChange={(checked) => {
                const isChecked = typeof checked === 'boolean' ? checked : !!checked?.target?.checked;
                if (isChecked) {
                  setSelectedIds(prev => [...prev, row.id]);
                } else {
                  setSelectedIds(prev => prev.filter(id => id !== row.id));
                }
              }}
            />
          </div>
        )
      },
      { 
        header: 'Workflow', 
        className: 'w-[45%] text-left',
        accessor: (row) => (
          <div className="block text-left min-w-0 max-w-[200px] sm:max-w-[320px]">
            <Link 
              href={`/admin/workflows/${row.id}`} 
              className="font-semibold text-foreground hover:text-accent-blue transition-colors block truncate text-sm" 
              data-tooltip={row.name}
            >
              {row.name}
            </Link>
            <div className="text-xs text-text-secondary mt-0.5 font-mono">
              <TruncatedText text={row.id} prefix="ID: " maxChars={8} copyable={true} />
            </div>
          </div>
        )
      },
      { 
        header: 'Status', 
        className: 'w-[15%]', 
        accessor: (row) => row.isActive ? 'ACTIVE' : 'INACTIVE', 
        isStatus: true 
      },
      { 
        header: 'Created', 
        className: 'w-[20%]', 
        accessor: (row) => (
          <span className="text-xs text-text-secondary">
            {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        ) 
      },
      { 
        header: 'Actions', 
        className: 'w-[20%] text-center',
        accessor: (row) => (
          <div className="flex justify-center items-center">
            <Link 
              href={`/admin/workflows/${row.id}`} 
              className="group inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-background border border-border-subtle hover:bg-border-subtle hover:text-foreground text-text-secondary transition-colors"
            >
              View Logs
            </Link>
          </div>
        ) 
      },
    ];
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            {tenantIdFilter ? 'Tenant Workflows' : 'All Tenant Workflows'}
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-secondary">
              {allFilteredWorkflowIds.length} {allFilteredWorkflowIds.length === 1 ? 'workflow' : 'workflows'}
            </span>
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-text-secondary">
              {tenantIdFilter 
                ? 'Viewing workflows for a specific tenant account.' 
                : 'A global view of all workflows created by all tenants across the platform.'}
            </p>
            {tenantIdFilter && (
              <Link href="/admin/workflows" className="text-xs font-medium px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md hover:bg-accent-blue/20">
                Clear Tenant Filter &times;
              </Link>
            )}
          </div>
        </div>

        {/* Global Bulk Action Bar if items selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
            <span className="text-xs text-red-400 font-semibold px-2">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-text-secondary hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              Deselect
            </button>
            <button 
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer"
            >
              <Trash2 size={13} />
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls Bar (Image 3 implementation) */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows by name or ID..."
              className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tenant Filter (if viewing globally) */}
            {!tenantIdFilter && tenantOptions.length > 2 && (
              <div className="w-44 shrink-0">
                <Select
                  value={selectedTenant}
                  onChange={setSelectedTenant}
                  options={tenantOptions}
                  buttonClassName="py-2 text-xs"
                />
              </div>
            )}

            {/* Status Filter */}
            <div className="w-36 shrink-0">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'INACTIVE', label: 'Inactive Only' }
                ]}
                buttonClassName="py-2 text-xs"
              />
            </div>

            {/* Date Range Filter */}
            <div className="w-36 shrink-0">
              <Select
                value={dateRange}
                onChange={setDateRange}
                options={[
                  { value: 'ALL', label: 'All Time' },
                  { value: 'TODAY', label: 'Today' },
                  { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
                  { value: 'LAST_30_DAYS', label: 'Last 30 Days' },
                  { value: 'LAST_90_DAYS', label: 'Last 90 Days' }
                ]}
                buttonClassName="py-2 text-xs"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-semibold text-accent-blue hover:text-white bg-accent-blue/10 hover:bg-accent-blue/20 rounded-lg border border-accent-blue/20 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary & Select All Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-text-tertiary pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{allFilteredWorkflowIds.length}</strong> of {totalRawWorkflows} workflows
            </span>
            {hasActiveFilters && (
              <span className="text-accent-blue font-medium">• Filters applied</span>
            )}
          </div>

          {allFilteredWorkflowIds.length > 0 && (
            <div className="flex items-center gap-3">
              {selectedIds.length !== allFilteredWorkflowIds.length ? (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Select all {allFilteredWorkflowIds.length} visible
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Clear all selections
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Grouped Workflows Table */}
      {Object.keys(filteredGroupedWorkflows).length === 0 ? (
        <div className="w-full border border-border-subtle rounded-xl bg-card p-12 text-center text-sm text-text-secondary space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-text-tertiary">
            <Filter size={20} />
          </div>
          <h3 className="font-semibold text-white">No workflows matching criteria</h3>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto">
            Try adjusting your search keywords, status filter, or date range to see workflows.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 rounded-lg border border-accent-blue/20 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroupedWorkflows).map(([tenantName, group]) => (
            <div key={tenantName} className="border border-border-subtle rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="bg-background/80 border-b border-border-subtle px-4 py-3 flex items-center justify-between">
                <Link href={`/admin/users/${group.client?.id}`} className="block group">
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-accent-blue transition-colors">
                    {tenantName}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5 group-hover:text-accent-blue/70 transition-colors">
                    {group.client?.email}
                  </p>
                </Link>
                <div className="text-xs font-medium bg-border-subtle px-2.5 py-1 rounded-full text-text-secondary">
                  {group.workflows.length} Workflow{group.workflows.length !== 1 && 's'}
                </div>
              </div>
              <DataTable 
                data={group.workflows} 
                columns={getTableColumns(group.workflows)} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeBulkDelete}
        title="Delete Workflows"
        message={`Are you sure you want to delete ${selectedIds.length} selected workflow(s)? This will permanently remove them from the system and cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
