'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  X, 
  Search, 
  Layers, 
  Eye, 
  ExternalLink,
  Filter
} from 'lucide-react';
import DataTable from '@/components/DataTable';
import TruncatedText from '@/components/ui/TruncatedText';
import Select from '@/components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  ACTIVE: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  FAILED: 'text-red-400 bg-red-500/10 border-red-500/20',
  PARTIALLY_FAILED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CANCELLED: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
};

export default function WorkflowInternalClient({ workflow }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedState, setCopiedState] = useState(false);

  const logs = workflow.executionLogs || [];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = log.id.toLowerCase().includes(q);
        const matchRef = (log.externalReferenceId || '').toLowerCase().includes(q);
        const matchState = JSON.stringify(log.currentNodeState || '').toLowerCase().includes(q);
        if (!matchId && !matchRef && !matchState) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchQuery]);

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedState(true);
    toast.success('Internal state JSON copied to clipboard');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const getStepSummary = (state) => {
    if (!state || typeof state !== 'object') return { step: 'TRIGGER', summary: 'Run initialized' };
    const step = state.step || state.nodeId || state.action || 'STEP';
    let summary = '';
    if (state.payload) {
      if (state.payload.fileName) summary = state.payload.fileName;
      else if (state.payload.caption) summary = state.payload.caption.slice(0, 30);
      else if (state.payload.email) summary = state.payload.email;
      else if (state.payload.rowId) summary = `Row #${state.payload.rowId}`;
    }
    return { step, summary };
  };

  const tableColumns = [
    { 
      header: 'Log ID', 
      className: 'w-[15%]',
      accessor: (row) => <TruncatedText text={row.id} maxChars={8} copyable={true} /> 
    },
    { 
      header: 'Status', 
      className: 'w-[15%]',
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[row.status] || STATUS_COLORS.CANCELLED}`}>
          {row.status}
        </span>
      )
    },
    { 
      header: 'Step / State', 
      className: 'w-[35%]',
      accessor: (row) => {
        const { step, summary } = getStepSummary(row.currentNodeState);
        return (
          <div className="flex items-center gap-2 min-w-0 max-w-sm">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-accent-blue shrink-0">
              {step}
            </span>
            {summary && (
              <span className="text-xs text-text-secondary truncate block" data-tooltip={summary}>
                {summary}
              </span>
            )}
            <button
              type="button"
              onClick={() => setSelectedLog(row)}
              className="ml-auto px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10 transition-colors shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Eye size={11} />
              JSON
            </button>
          </div>
        );
      }
    },
    { 
      header: 'Ext. Reference', 
      className: 'w-[15%]',
      accessor: (row) => row.externalReferenceId ? (
        <TruncatedText text={row.externalReferenceId} maxChars={12} copyable={true} />
      ) : <span className="text-text-tertiary">N/A</span> 
    },
    { 
      header: 'Timestamp', 
      className: 'w-[20%]',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
          <Clock size={12} className="shrink-0 text-text-tertiary" />
          <span>{new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      )
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link 
          href="/admin/workflows" 
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to All Workflows
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{workflow.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                workflow.isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              }`}>
                {workflow.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-text-tertiary">Tenant:</span>
                <Link 
                  href={`/admin/users/${workflow.client?.id}`}
                  className="font-medium text-white hover:text-accent-blue transition-colors flex items-center gap-1"
                >
                  {workflow.client?.name || 'User'} ({workflow.client?.email})
                  <ExternalLink size={11} className="text-text-tertiary" />
                </Link>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-text-tertiary">Workflow ID:</span>
                <TruncatedText text={workflow.id} maxChars={12} copyable={true} className="font-mono text-white" />
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-text-tertiary">Total Recorded Runs:</span>
                <span className="font-semibold text-white font-mono">{logs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] border border-border-subtle p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by log ID, reference, or payload..."
              className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div className="w-36 shrink-0">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ACTIVE', label: 'Active / Running' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'PARTIALLY_FAILED', label: 'Partially Failed' }
              ]}
            />
          </div>
        </div>

        <div className="text-xs text-text-tertiary font-medium">
          Showing {filteredLogs.length} of {logs.length} run{logs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Execution Logs Table with Responsive Mobile Card Fallback */}
      <div className="border border-border-subtle rounded-xl overflow-hidden shadow-sm bg-[#111]">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity size={32} className="text-text-tertiary mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-white">No execution runs found</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Try adjusting your search query or status filter.' 
                : 'This workflow has not recorded any execution runs yet.'}
            </p>
          </div>
        ) : (
          <DataTable
            data={filteredLogs}
            columns={tableColumns}
            renderMobileCard={(row) => {
              const { step, summary } = getStepSummary(row.currentNodeState);
              return (
                <div key={row.id} className="p-4 border-b border-border-subtle/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <TruncatedText text={row.id} prefix="Log ID: " maxChars={8} copyable={true} className="font-mono text-xs text-text-secondary" />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[row.status] || STATUS_COLORS.CANCELLED}`}>
                      {row.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-accent-blue shrink-0">
                        {step}
                      </span>
                      {summary && <span className="text-xs text-text-secondary truncate">{summary}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLog(row)}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Eye size={12} />
                      Payload
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-white/5">
                    <span>Ref: {row.externalReferenceId || 'N/A'}</span>
                    <span>{new Date(row.createdAt).toLocaleDateString()} at {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* JSON Payload Inspector Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70"
              onClick={() => setSelectedLog(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0f0f12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[85vh] my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Execution State & Payload</h3>
                    <span className="text-[11px] text-text-tertiary font-mono">Log #{selectedLog.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyJson(selectedLog.currentNodeState)}
                    className="px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedState ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedState ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto max-h-[65vh] space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl font-sans text-xs">
                  <div>
                    <span className="text-text-tertiary block text-[11px]">Execution Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 ${STATUS_COLORS[selectedLog.status] || STATUS_COLORS.CANCELLED}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block text-[11px]">Timestamp</span>
                    <span className="text-white font-medium block mt-0.5">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-emerald-400 text-xs leading-relaxed font-mono">
                    {JSON.stringify(selectedLog.currentNodeState, null, 2) || '// No state recorded'}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
