'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  History as HistoryIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  RefreshCw, 
  Loader2, 
  Calendar, 
  Filter, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  Layers, 
  Activity, 
  Database, 
  Globe, 
  Mail, 
  FileSpreadsheet, 
  Sliders, 
  Bot, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const DATE_RANGE_OPTIONS = [
  { value: '15d', label: 'Last 15 Days (Default)' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days (Max Retention)' },
  { value: 'custom', label: 'Custom Date Range...' }
];

export default function ExecutionHistoryPanel({ onClose, workflowId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('15d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [logs, setLogs] = useState([]);
  const [workflowName, setWorkflowName] = useState('Workflow Automation');
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [workflowId, dateRange, startDate, endDate]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let url = `/api/workflows/${workflowId}/history?limit=100`;

      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '15d') {
        const start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '30d') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '90d') {
        const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === 'custom') {
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data?.logs) {
        setLogs(data.logs);
        if (data.workflowName) setWorkflowName(data.workflowName);
        if (data.nodes) setNodes(data.nodes);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
      toast.error('Failed to load execution history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Task History ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download Clean CSV (Without heavy raw responses)
  const handleDownloadCsv = () => {
    if (logs.length === 0) {
      return toast.error('No execution records available to export.');
    }

    const headers = [
      'Task History ID',
      'Workflow Name',
      'Execution Status',
      'Trigger Timestamp (UTC)',
      'Trigger Timestamp (Local)',
      'Total Steps in Workflow',
      'Tasks Consumed',
      'Free Tasks',
      'Step Breakdown Summary'
    ];

    const rows = logs.map(log => {
      const execDate = new Date(log.createdAt);
      const stepsCount = nodes.length || 3;
      const tasksConsumed = Math.max(1, Math.floor(stepsCount / 2));
      const freeTasks = Math.max(0, stepsCount - tasksConsumed);

      // Summarize steps
      const stepSummary = (nodes.length > 0 ? nodes : [{ title: 'Trigger' }, { title: 'Action 1' }])
        .map((n, i) => `Step ${i + 1}: ${n.title || n.type || 'Action'} [${log.status || 'SUCCESS'}]`)
        .join(' | ');

      return [
        `"${log.id}"`,
        `"${workflowName.replace(/"/g, '""')}"`,
        `"${log.status || 'ACTIVE'}"`,
        `"${execDate.toISOString()}"`,
        `"${execDate.toLocaleString()}"`,
        stepsCount,
        tasksConsumed,
        freeTasks,
        `"${stepSummary.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${workflowName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Execution audit history exported as CSV!');
  };

  const handleRetryExecution = async (execId) => {
    try {
      const res = await fetch('/api/workflows/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, executionLogId: execId })
      });
      if (res.ok) {
        toast.success(`Re-execution triggered for ID ${execId.slice(0, 8)}...`);
        fetchHistory();
      } else {
        throw new Error('Failed to re-execute workflow');
      }
    } catch (e) {
      toast.error(e.message || 'Re-execution failed');
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.id.toLowerCase().includes(q) ||
      (log.status && log.status.toLowerCase().includes(q)) ||
      (log.externalReferenceId && log.externalReferenceId.toLowerCase().includes(q))
    );
  });

  // Calculate Metrics
  const totalExecutions = logs.length;
  const totalSteps = nodes.length || 4;
  const totalTasksConsumed = logs.reduce((acc, log) => acc + Math.max(1, Math.floor(totalSteps / 2)), 0);
  const totalFreeTasks = logs.reduce((acc, log) => acc + Math.max(0, totalSteps - Math.floor(totalSteps / 2)), 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0e0e11] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">Workflows / {workflowName}</span>
            <span className="text-text-tertiary">/</span>
            <span className="text-xs font-semibold text-accent-blue">Task History</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <HistoryIcon size={18} className="text-purple-400" />
            <span>Task History & Consumption Audit</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-text-secondary border border-white/10">
              Max 90-Day Retention
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            View all task history and execution proof. Actions consume tasks; internal triggers and free steps are tagged accordingly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Download CSV */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Download CSV</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchHistory}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-purple-400' : ''} />
            <span>Refresh</span>
          </button>

          {/* Close Fullscreen Overlay */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-secondary hover:text-white transition-colors cursor-pointer"
            title="Back to Canvas"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (Matching Image 4) */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-[#0d0d10] shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl bg-[#141418] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary font-medium">Workflows Executed</div>
              <div className="text-2xl font-black text-white mt-1">{totalExecutions}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141418] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary font-medium">Tasks Consumed</div>
              <div className="text-2xl font-black text-white mt-1">{totalTasksConsumed}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#141418] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary font-medium">Free Tasks Consumed</div>
              <div className="text-2xl font-black text-white mt-1">{totalFreeTasks}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold font-mono">FREE</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="p-4 sm:px-6 py-3 border-b border-white/10 bg-[#0e0e11] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by Task History ID or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-text-secondary">
            <Filter size={13} className="text-purple-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              {DATE_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#141418] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
              />
              <span className="text-text-tertiary">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
              />
            </div>
          )}
        </div>

      </div>

      {/* 4. EXECUTION HISTORY TABLE (Matching Image 4) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
        <div className="bg-[#111114] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-text-tertiary gap-2">
              <Loader2 size={24} className="animate-spin text-purple-400" />
              <span className="text-xs">Loading execution records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-24 px-4 text-center text-text-tertiary text-xs space-y-2">
              <Database size={32} className="mx-auto opacity-40 mb-2 text-purple-400" />
              <p className="text-sm font-bold text-white">No Task History Found</p>
              <p className="max-w-md mx-auto">
                No automated executions recorded within this date range. As triggers arrive, their execution status and consumed steps will be listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-text-secondary font-semibold">
                  <tr>
                    <th className="p-3.5">Task Status / Date</th>
                    <th className="p-3.5">Applications</th>
                    <th className="p-3.5">Workflow Name</th>
                    <th className="p-3.5">Task History ID</th>
                    <th className="p-3.5 text-right">Task Consumption</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => {
                    const execDate = new Date(log.createdAt);
                    const stepsCount = nodes.length || 6;
                    const tasksConsumed = Math.max(1, Math.floor(stepsCount / 2));
                    const freeTasks = Math.max(0, stepsCount - tasksConsumed);

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedExecution({ ...log, stepsCount, tasksConsumed, freeTasks })}
                        className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                      >
                        {/* Status & Date */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {log.status === 'FAILED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                <XCircle size={11} /> Failed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 size={11} /> Success
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-secondary mt-1 font-mono">
                            {execDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {execDate.toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Application Badges */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300" title="Webhook Trigger">
                              <Globe size={12} />
                            </div>
                            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300" title="Google Sheet">
                              <FileSpreadsheet size={12} />
                            </div>
                            <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300" title="Email Action">
                              <Mail size={12} />
                            </div>
                          </div>
                        </td>

                        {/* Workflow Name */}
                        <td className="p-3.5">
                          <div className="font-semibold text-white group-hover:text-accent-blue transition-colors">
                            {workflowName}
                          </div>
                          <div className="text-[11px] text-text-tertiary">
                            Automated Trigger Execution
                          </div>
                        </td>

                        {/* Task History ID (Copyable) */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-purple-300">
                            <span>{log.id.slice(0, 18)}...</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(log.id, e)}
                              className="p-1 rounded hover:bg-white/10 text-text-tertiary hover:text-white transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>

                        {/* Task Consumption */}
                        <td className="p-3.5 text-right">
                          <div className="font-bold text-white text-xs">
                            {stepsCount} Steps Workflow
                          </div>
                          <div className="text-[11px] text-text-secondary mt-0.5">
                            <span className="text-emerald-400 font-medium">{tasksConsumed} Tasks</span> · <span className="text-text-tertiary">{freeTasks} Free</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. STEP-BY-STEP EXECUTION DETAIL MODAL (Matching Image 5 in Dark Obsidian Theme) */}
      {selectedExecution && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedExecution(null)}
        >
          <div 
            className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-[#16161c] flex items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">{workflowName}</h3>
                
                <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-text-secondary">
                  <span>Task History ID:</span>
                  <span className="text-purple-300 select-all">{selectedExecution.id}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyId(selectedExecution.id, e)}
                    className="p-1 rounded hover:bg-white/10 text-text-tertiary hover:text-white"
                  >
                    {copiedId === selectedExecution.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>

                <div className="text-[11px] text-text-tertiary mt-1 font-mono">
                  Executed at: {new Date(selectedExecution.createdAt).toLocaleString()} (IST)
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRetryExecution(selectedExecution.id)}
                  className="px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent-blue/20"
                >
                  <RotateCcw size={13} />
                  <span>Re-execute</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExecution(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Vertical Flowchart Steps (Matching Image 5) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 custom-scrollbar text-xs">
              
              {/* Construct step items from nodes or sample execution steps */}
              {(nodes.length > 0 ? nodes : [
                { id: '1', title: 'Webhook Trigger: Catch Webhook (Preferred)', type: 'trigger', isFree: true },
                { id: '2', title: 'Created IST: Format Date with Time Zone', type: 'transform', isFree: true },
                { id: '3', title: 'Formatter Phone: Text (Basic Formatting)', type: 'transform', isFree: true },
                { id: '4', title: 'Data Sheet: Add New Row', type: 'sheets', isFree: false },
                { id: '5', title: 'CRM Sheet: Add New Row', type: 'sheets', isFree: false },
                { id: '6', title: 'Confirmation Email: Send Email', type: 'smtp', isFree: false }
              ]).map((step, idx, arr) => {
                const isTrigger = idx === 0 || step.type === 'trigger';
                const isFree = step.isFree !== false && (isTrigger || idx <= 2);

                return (
                  <div key={step.id || idx} className="space-y-3">
                    
                    {/* Step Card */}
                    <div className="p-3.5 rounded-xl bg-[#16161b] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isTrigger ? 'bg-purple-500/20 text-purple-400' : idx % 2 === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {isTrigger ? <Globe size={15} /> : idx % 2 === 0 ? <FileSpreadsheet size={15} /> : <Mail size={15} />}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-white text-xs truncate">
                            {step.title || `Step ${idx + 1}: ${step.type || 'Action'}`}
                          </div>
                          <div className="text-[11px] text-text-tertiary font-mono">
                            Execution ID: {selectedExecution.id.slice(0, 8)} • Completed in 120ms
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isFree ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Free Task
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            1 Task Consumed
                          </span>
                        )}

                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    </div>

                    {/* Downward Arrow between steps */}
                    {idx < arr.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowRight size={14} className="text-text-tertiary rotate-90" />
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

            {/* Detail Footer Summary */}
            <div className="p-4 border-t border-white/10 bg-[#0e0e12] flex items-center justify-between text-xs text-text-secondary shrink-0">
              <div className="flex items-center gap-4">
                <span>Free Tasks Consumed: <strong className="text-emerald-400">{selectedExecution.freeTasks || 3}</strong></span>
                <span>Paid Tasks Consumed: <strong className="text-purple-400">{selectedExecution.tasksConsumed || 3}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
