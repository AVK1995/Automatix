'use client';

import { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import { Plus, Search, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { createWorkflow, deleteWorkflow, updateWorkflow } from '@/actions/workflows';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Select from '@/components/ui/Select';
import { AlertTriangle, AlertCircle, Clock, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveNotification, ignoreNotification } from '@/actions/notifications';
import TruncatedText from '@/components/ui/TruncatedText';

function IssuesTooltip({ issues }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const router = useRouter();
  const tooltipRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && 
          tooltipRef.current && 
          !tooltipRef.current.contains(event.target) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (triggerRef.current && typeof window !== 'undefined') {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      setCoords({
        top: isMobile ? rect.bottom + 12 : rect.top + rect.height / 2,
        left: isMobile ? 16 : rect.right + 16,
        isMobile
      });
    }
  };

  const handleResolve = (e, issue) => {
    e.stopPropagation();
    if (issue.metadata?.workflowId) {
      router.push(`/workflows/${issue.metadata.workflowId}`);
    }
  };

  const handleIgnore = async (e, id) => {
    e.stopPropagation();
    try {
      setIsOpen(false);
      await ignoreNotification(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (!issues || issues.length === 0) return null;

  return (
    <div 
      className="relative flex items-center" 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          updatePosition();
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }}
      ref={triggerRef}
    >
      <div className="text-red-400 cursor-help p-1 -m-1">
        <AlertTriangle size={14} />
      </div>
      
      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: coords.isMobile ? 0 : -5, y: coords.isMobile ? -5 : '-50%' }}
            animate={{ opacity: 1, x: 0, y: coords.isMobile ? 0 : '-50%' }}
            exit={{ opacity: 0, x: coords.isMobile ? 0 : -5, y: coords.isMobile ? -5 : '-50%' }}
            transition={{ duration: 0.15 }}
            style={{ 
              position: 'fixed', 
              top: coords.top, 
              left: coords.left,
              width: coords.isMobile ? 'calc(100vw - 32px)' : '320px'
            }}
            className="bg-card border border-border-subtle rounded-md shadow-2xl z-[9999] overflow-hidden flex flex-col cursor-default"
            ref={tooltipRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-500/10 border-b border-border-subtle px-3 py-2 text-xs font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle size={12} />
              {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Detected
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {issues.map((issue) => (
                <div key={issue.id} className="p-3 border-b border-border-subtle last:border-b-0">
                  <p className="text-xs text-white mb-2 whitespace-normal break-words text-left leading-relaxed">
                    {issue.message || 'Workflow configuration error'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleResolve(e, issue)}
                      className="text-[10px] font-medium bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 px-2 py-1 rounded transition-colors"
                    >
                      Resolve
                    </button>
                    {issue.status === 'UNREAD' && (
                      <button 
                        onClick={(e) => handleIgnore(e, issue.id)}
                        className="text-[10px] font-medium text-text-secondary hover:text-white border border-border-subtle hover:bg-white/5 px-2 py-1 rounded transition-colors"
                      >
                        Ignore
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function WorkflowsClient({ workflows, notifications: rawNotifications = [] }) {
  const notifications = (() => {
    const deduped = [];
    const seen = new Set();
    for (const n of rawNotifications) {
      const key = (n.metadata?.workflowId && n.metadata?.nodeId) ? `${n.metadata.workflowId}-${n.metadata.nodeId}` : n.message;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(n);
      } else {
        const existingIdx = deduped.findIndex(d => ((d.metadata?.workflowId && d.metadata?.nodeId) ? `${d.metadata.workflowId}-${d.metadata.nodeId}` : d.message) === key);
        if (existingIdx >= 0 && deduped[existingIdx].status === 'IGNORED' && n.status === 'UNREAD') {
           deduped[existingIdx] = n;
        }
      }
    }
    return deduped;
  })();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS'
  const [isCreating, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const router = useRouter();

  const handleCreate = () => {
    startTransition(async () => {
      await createWorkflow();
    });
  };

  const filteredWorkflows = useMemo(() => {
    const now = Date.now();
    return workflows.filter(workflow => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (workflow.name || '').toLowerCase().includes(q);
        const matchId = (workflow.id || '').toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }

      // Status
      if (statusFilter === 'ACTIVE' && !workflow.isActive) return false;
      if (statusFilter === 'INACTIVE' && workflow.isActive) return false;

      // Date Range
      if (dateRange !== 'ALL') {
        const createdMs = new Date(workflow.createdAt).getTime();
        const ageDays = (now - createdMs) / (1000 * 60 * 60 * 24);
        if (dateRange === 'TODAY' && ageDays > 1) return false;
        if (dateRange === 'LAST_7_DAYS' && ageDays > 7) return false;
        if (dateRange === 'LAST_30_DAYS' && ageDays > 30) return false;
      }

      return true;
    });
  }, [workflows, searchQuery, statusFilter, dateRange]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL' || dateRange !== 'ALL';

  const columns = [
    { 
      header: (
        <Checkbox 
          checked={selectedIds.length === filteredWorkflows.length && filteredWorkflows.length > 0}
          onChange={(checked) => {
            if (checked) setSelectedIds(filteredWorkflows.map(w => w.id));
            else setSelectedIds([]);
          }}
        />
      ),
      className: 'w-[40px] pl-4',
      accessor: (row) => (
        <Checkbox 
          checked={selectedIds.includes(row.id)}
          onChange={(checked) => {
            if (checked) setSelectedIds([...selectedIds, row.id]);
            else setSelectedIds(selectedIds.filter(id => id !== row.id));
          }}
        />
      )
    },
    { 
      header: 'Name', 
      className: 'text-left',
      accessor: (row) => {
        let issues = notifications.filter(n => n.metadata?.workflowId === row.id && n.status !== 'RESOLVED');
        
        if (editingId === row.id) {
          return (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && editingName.trim()) {
                    setIsRenaming(true);
                    try {
                      await updateWorkflow(row.id, { name: editingName.trim() });
                      router.refresh();
                    } finally {
                      setIsRenaming(false);
                      setEditingId(null);
                    }
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                disabled={isRenaming}
                className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-blue min-w-[200px]"
              />
              <button 
                onClick={async () => {
                  if (editingName.trim()) {
                    setIsRenaming(true);
                    try {
                      await updateWorkflow(row.id, { name: editingName.trim() });
                      router.refresh();
                    } finally {
                      setIsRenaming(false);
                      setEditingId(null);
                    }
                  }
                }}
                disabled={isRenaming}
                className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors"
              >
                {isRenaming ? <div className="w-3.5 h-3.5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setEditingId(null)}
                disabled={isRenaming}
                className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }

        return (
          <div className="flex flex-col min-w-0 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
            <div className="flex items-center gap-2 relative group min-w-0">
              <Link 
                href={`/workflows/${row.id}`} 
                className="flex items-center hover:text-accent-blue transition-colors min-w-0"
                data-tooltip={row.name}
              >
                <span className="font-medium truncate block">{row.name}</span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setEditingId(row.id);
                  setEditingName(row.name);
                }}
                className="p-1 -ml-1 text-text-secondary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-white"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              {issues.length > 0 && <div className="ml-1"><IssuesTooltip issues={issues} /></div>}
            </div>
            <div className="text-[11px] text-text-secondary font-mono mt-0.5">
              <TruncatedText text={row.id} prefix="ID: " maxChars={8} copyable={true} />
            </div>
          </div>
        );
      }
    },
    { header: 'Status', accessor: (row) => (row.isActive ? 'Active' : 'Inactive'), isStatus: true },
    { header: 'Created', accessor: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
    { 
      header: 'Actions', 
      className: 'text-center w-[120px]',
      accessor: (row) => (
        <div className="flex justify-center items-center gap-3">
          <Link 
            href={`/workflows/${row.id}`} 
            className="text-xs font-medium text-accent-blue hover:text-white transition-colors"
          >
            Builder &rarr;
          </Link>
        </div>
      ) 
    },
  ];

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter(w => w.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground mb-1">Your Workflows</h1>
          <p className="text-sm text-text-secondary">Build and manage your automations.</p>
        </div>
        <button 
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center gap-2 bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {isCreating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
          {isCreating ? 'Creating...' : 'Create New'}
        </button>
      </div>


      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-card border border-border-subtle rounded-md p-3 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 shrink-0 text-center sm:text-left overflow-hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-semibold shrink-0 text-sm sm:text-base">
              {totalWorkflows}
            </div>
            <div className="min-w-0 w-full">
              <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider font-medium truncate">Total Built</p>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-0.5 truncate">All Automations</p>
            </div>
          </div>
          <div className="bg-card border border-border-subtle rounded-md p-3 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 shrink-0 text-center sm:text-left overflow-hidden">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-semibold shrink-0 text-sm sm:text-base">
              {activeWorkflows}
            </div>
            <div className="min-w-0 w-full">
              <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-wider font-medium truncate">
                <span className="sm:hidden">Active</span>
                <span className="hidden sm:inline">Currently Active</span>
              </p>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-0.5 truncate">Live Running</p>
            </div>
          </div>
        </div>

        {/* Search, Filters & Bulk Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <Link 
            href="/dashboard/workflows/history"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border-subtle px-3.5 py-2 rounded-md text-xs font-medium transition-colors shrink-0"
          >
            <Clock size={14} className="text-accent-blue" />
            <span>Run History</span>
          </Link>

          {/* Status Filter */}
          <div className="w-32 shrink-0">
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
                { value: 'LAST_30_DAYS', label: 'Last 30 Days' }
              ]}
              buttonClassName="py-2 text-xs"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDateRange('ALL');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-accent-blue hover:text-white bg-accent-blue/10 hover:bg-accent-blue/20 rounded-md border border-accent-blue/20 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}

          {selectedIds.length > 0 && (
            <button 
              onClick={() => setIsConfirmOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3.5 py-2 rounded-md text-xs font-medium transition-colors shrink-0"
            >
              <Trash2 size={13} />
              {isDeleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
            </button>
          )}

          <div className="relative flex-1 min-w-[180px] md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-text-secondary" />
            </div>
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border-subtle rounded-md pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <DataTable 
        data={filteredWorkflows} 
        columns={columns} 
        renderMobileCard={(row, i) => {
          const issues = notifications.filter(n => n.metadata?.workflowId === row.id && n.status !== 'RESOLVED');
          return (
            <div key={i} className="bg-card border border-border-subtle rounded-md p-4 flex flex-col gap-3 relative min-w-0">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="pt-0.5 shrink-0">
                    <Checkbox 
                      checked={selectedIds.includes(row.id)}
                      onChange={(checked) => {
                        if (checked) setSelectedIds([...selectedIds, row.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== row.id));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    {editingId === row.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <input 
                          type="text" 
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && editingName.trim()) {
                              setIsRenaming(true);
                              try {
                                await updateWorkflow(row.id, { name: editingName.trim() });
                                router.refresh();
                              } finally {
                                setIsRenaming(false);
                                setEditingId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          disabled={isRenaming}
                          className="bg-black/50 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-blue w-full"
                        />
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={async () => {
                              if (editingName.trim()) {
                                setIsRenaming(true);
                                try {
                                  await updateWorkflow(row.id, { name: editingName.trim() });
                                  router.refresh();
                                } finally {
                                  setIsRenaming(false);
                                  setEditingId(null);
                                }
                              }
                            }}
                            disabled={isRenaming}
                            className="p-1 hover:bg-green-500/20 text-green-500 rounded transition-colors bg-green-500/10 border border-green-500/20"
                          >
                            {isRenaming ? <div className="w-3.5 h-3.5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            disabled={isRenaming}
                            className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors bg-red-500/10 border border-red-500/20"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 relative group min-w-0 max-w-full">
                        <Link 
                          href={`/workflows/${row.id}`} 
                          className="font-medium text-white hover:text-accent-blue transition-colors truncate"
                          data-tooltip={row.name}
                        >
                          {row.name}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingId(row.id);
                            setEditingName(row.name);
                          }}
                          className="p-1 text-text-secondary transition-opacity hover:text-white shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                      <span>{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>&bull;</span>
                      <span className={row.isActive ? 'text-green-500 font-medium' : 'text-zinc-400 font-medium'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                {issues.length > 0 && (
                  <div className="shrink-0 pt-0.5">
                    <IssuesTooltip issues={issues} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end mt-1 pt-3 border-t border-border-subtle">
                <Link 
                  href={`/workflows/${row.id}`} 
                  className="text-xs font-medium text-accent-blue hover:text-white transition-colors"
                >
                  Builder &rarr;
                </Link>
              </div>
            </div>
          );
        }}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
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
        }}
        title="Delete Workflows"
        message={`Are you sure you want to delete ${selectedIds.length} workflow(s)? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
