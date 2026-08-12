'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, Activity, CheckCircle2, XCircle, Clock, Play, XSquare, AlertTriangle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getWorkflowExecutionHistory } from '@/actions/workflows';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = {
  ACTIVE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  COMPLETED: 'text-green-400 bg-green-500/10 border-green-500/20',
  FAILED: 'text-red-400 bg-red-500/10 border-red-500/20',
  CANCELLED: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  PARTIALLY_FAILED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const STATUS_ICONS = {
  ACTIVE: <Activity className="w-3.5 h-3.5" />,
  COMPLETED: <CheckCircle2 className="w-3.5 h-3.5" />,
  FAILED: <XCircle className="w-3.5 h-3.5" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5" />,
  PARTIALLY_FAILED: <AlertTriangle className="w-3.5 h-3.5" />,
};

export default function HistoryClient({ workflows }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [filters, setFilters] = useState({
    status: 'ALL',
    workflowId: '',
    dateRange: 'ALL', // 'ALL', 'TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS'
  });

  const [activeLog, setActiveLog] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skippedNodes, setSkippedNodes] = useState([]);
  const [skipWarningOpen, setSkipWarningOpen] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const dateRangeParams = {};
      const now = new Date();
      if (filters.dateRange === 'TODAY') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateRangeParams.from = start.toISOString();
      } else if (filters.dateRange === 'LAST_7_DAYS') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateRangeParams.from = start.toISOString();
      } else if (filters.dateRange === 'LAST_30_DAYS') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateRangeParams.from = start.toISOString();
      }

      const res = await getWorkflowExecutionHistory({
        status: filters.status,
        workflowId: filters.workflowId,
        dateRange: dateRangeParams
      });
      setLogs(res || []);
    } catch (e) {
      console.error('Failed to fetch logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    setSelectedIds([]); // clear selection when filters change
  }, [filters]);

  const handleExportCSV = () => {
    if (selectedIds.length === 0) return;
    
    // Extract trigger payload from selected logs
    const selectedLogs = logs.filter(l => selectedIds.includes(l.id));
    const csvRows = [];
    
    // Header row
    csvRows.push(['Log ID', 'Workflow Name', 'Status', 'Date', 'Trigger Payload (JSON)'].join(','));
    
    for (const log of selectedLogs) {
      const workflowName = log.workflow?.name || 'Unknown';
      const status = log.status;
      const date = new Date(log.createdAt).toISOString();
      
      let payloadStr = '{}';
      if (log.currentNodeState && typeof log.currentNodeState === 'object') {
        payloadStr = JSON.stringify(log.currentNodeState.payload || {});
      }
      
      // Escape quotes for CSV
      const escapedPayload = `"${payloadStr.replace(/"/g, '""')}"`;
      csvRows.push([log.id, `"${workflowName}"`, status, date, escapedPayload].join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelExecution = async () => {
    if (!activeLog) return;
    setIsCancelling(true);
    try {
      const res = await fetch('/api/workflows/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionLogId: activeLog.id })
      });
      if (res.ok) {
        setActiveLog(prev => ({ ...prev, status: 'CANCELLED' }));
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRerunWorkflow = async (confirmSkips = false) => {
    if (!activeLog) return;
    if (skipModalOpen && skippedNodes.length > 0 && !confirmSkips) {
      // Check for dependencies (naive check on nodesJson)
      const nodesJson = activeLog.workflow?.nodesJson || [];
      const nodesString = JSON.stringify(nodesJson);
      let hasDependency = false;
      for (const skippedId of skippedNodes) {
        if (nodesString.includes(`{{${skippedId}.`)) {
          hasDependency = true; break;
        }
      }
      if (hasDependency) {
        setSkipWarningOpen(true);
        return;
      }
    }

    setIsRerunning(true);
    try {
      const res = await fetch('/api/workflows/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionLogId: activeLog.id, skipNodes: skippedNodes })
      });
      if (res.ok) {
        setSkipModalOpen(false);
        setSkipWarningOpen(false);
        setActiveLog(null);
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRerunning(false);
    }
  };

  const handleRerunStep = async (nodeId) => {
    if (!activeLog) return;
    try {
      await fetch('/api/workflows/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionLogId: activeLog.id, runOnlyNodeId: nodeId })
      });
      alert('Isolated execution triggered for this step!');
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    {
      header: (
        <Checkbox 
          checked={selectedIds.length === logs.length && logs.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < logs.length}
          onChange={(checked) => {
            if (checked) setSelectedIds(logs.map(l => l.id));
            else setSelectedIds([]);
          }}
        />
      ),
      className: 'w-[40px]',
      accessor: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox 
            checked={selectedIds.includes(row.id)}
            onChange={(checked) => {
              if (checked) setSelectedIds([...selectedIds, row.id]);
              else setSelectedIds(selectedIds.filter(id => id !== row.id));
            }}
          />
        </div>
      )
    },
    { 
      header: 'Workflow', 
      className: 'w-[40%] max-w-[200px] sm:max-w-[300px]',
      accessor: (row) => (
        <div className="truncate min-w-0" title={row.workflow?.name || 'Unknown'}>
          <span className="font-medium text-white truncate block">{row.workflow?.name || 'Unknown'}</span>
        </div>
      ) 
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[row.status] || STATUS_COLORS.CANCELLED}`}>
          {STATUS_ICONS[row.status]}
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </span>
      ) 
    },
    { 
      header: 'Date', 
      accessor: (row) => (
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Clock className="w-3.5 h-3.5" />
          {new Date(row.createdAt).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: 'numeric', minute: '2-digit' 
          })}
        </div>
      ) 
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveLog(row); }}
          className="text-xs font-medium text-accent-blue hover:text-white transition-colors px-3 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 rounded border border-accent-blue/20"
        >
          View Details
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows" className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-medium text-foreground mb-1">Execution History</h1>
            <p className="text-sm text-text-secondary">View detailed logs of your automated workflows.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <Select 
              value={filters.workflowId}
              onChange={(val) => setFilters(prev => ({...prev, workflowId: val}))}
              options={[
                { value: '', label: 'All Workflows' },
                ...workflows.map(w => ({ value: w.id, label: w.name }))
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select 
              value={filters.status}
              onChange={(val) => setFilters(prev => ({...prev, status: val}))}
              options={[
                { value: 'ALL', label: 'Any Status' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'PARTIALLY_FAILED', label: 'Partially Failed' },
                { value: 'ACTIVE', label: 'Running' }
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select 
              value={filters.dateRange}
              onChange={(val) => setFilters(prev => ({...prev, dateRange: val}))}
              options={[
                { value: 'ALL', label: 'All Time' },
                { value: 'TODAY', label: 'Today' },
                { value: 'LAST_7_DAYS', label: 'Last 7 Days' },
                { value: 'LAST_30_DAYS', label: 'Last 30 Days' }
              ]}
            />
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 shrink-0"
            >
              <span className="text-sm font-medium text-text-secondary">{selectedIds.length} selected</span>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-white text-black hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Export Trigger Data
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm font-medium text-text-secondary tracking-widest uppercase">Fetching Logs</p>
          </div>
        )}
        
        {(!isLoading && logs.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-text-secondary opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No execution logs found</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              We couldn't find any workflow runs matching your current filters. 
              {filters.status !== 'ALL' || filters.workflowId ? ' Try adjusting your filters to see more results.' : ' Create and run a workflow to see it here.'}
            </p>
            {(filters.status !== 'ALL' || filters.workflowId || filters.dateRange !== 'ALL') && (
              <button 
                onClick={() => setFilters({ status: 'ALL', workflowId: '', dateRange: 'ALL' })}
                className="mt-6 text-sm font-medium text-accent-blue hover:text-white transition-colors px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 rounded-md border border-accent-blue/20"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <DataTable 
            data={logs} 
            columns={columns} 
            onRowClick={(row) => setActiveLog(row)}
            renderMobileCard={(row) => (
              <div 
                key={row.id}
                className="p-4 border-b border-border-subtle hover:bg-white/5 cursor-pointer flex flex-col gap-3 min-w-0"
                onClick={() => setActiveLog(row)}
              >
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Checkbox 
                        checked={selectedIds.includes(row.id)}
                        onChange={(checked) => {
                          if (checked) setSelectedIds([...selectedIds, row.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== row.id));
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{row.workflow?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(row.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${STATUS_COLORS[row.status] || STATUS_COLORS.CANCELLED}`}>
                    {row.status}
                  </span>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {activeLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLog(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="px-6 py-5 border-b border-border-subtle flex items-start justify-between bg-white/5">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                    {activeLog.workflow?.name || 'Unknown Workflow'}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[activeLog.status] || STATUS_COLORS.CANCELLED}`}>
                      {STATUS_ICONS[activeLog.status]}
                      {activeLog.status.charAt(0) + activeLog.status.slice(1).toLowerCase()}
                    </span>
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Executed on {new Date(activeLog.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeLog.status === 'ACTIVE' && (
                    <button 
                      onClick={handleCancelExecution}
                      disabled={isCancelling}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      <XSquare className="w-3.5 h-3.5" />
                      {isCancelling ? 'Cancelling...' : 'Cancel Execution'}
                    </button>
                  )}
                  <button 
                    onClick={() => setSkipModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/20 rounded-md transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Rerun Workflow
                  </button>
                  <button 
                    onClick={() => setActiveLog(null)}
                    className="p-2 ml-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Trigger Payload Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-blue" />
                    Trigger Payload (Input)
                  </h3>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-text-secondary">
                      {activeLog.currentNodeState && typeof activeLog.currentNodeState === 'object' && activeLog.currentNodeState.payload
                        ? JSON.stringify(activeLog.currentNodeState.payload, null, 2)
                        : '// No trigger payload recorded'}
                    </pre>
                  </div>
                </div>

                {/* Execution Steps Section */}
                {activeLog.analyticsEvents && activeLog.analyticsEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-accent-blue" />
                      Execution Steps
                    </h3>
                    <div className="space-y-4">
                      {activeLog.analyticsEvents.map((evt, idx) => {
                        const isError = evt.eventType.includes('ERROR') || evt.eventType.includes('FAIL');
                        const isSuccess = evt.eventType.includes('SUCCESS') || evt.eventType.includes('COMPLETE');
                        
                        return (
                          <div key={evt.id} className={`p-4 rounded-xl border ${isError ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${isError ? 'bg-red-500/20 text-red-400' : isSuccess ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-text-secondary'}`}>
                                  {evt.eventType}
                                </span>
                                {(evt.eventType.includes('NODE_ACTION_FAIL') || evt.eventType.includes('NODE_ACTION_SUCCESS')) && evt.metadata?.nodeId && (
                                  <button 
                                    onClick={() => handleRerunStep(evt.metadata.nodeId)}
                                    className="text-[10px] uppercase font-bold tracking-wider text-accent-blue hover:text-white bg-accent-blue/10 px-2 py-1 rounded hover:bg-accent-blue/30 transition-colors"
                                  >
                                    Rerun This Step
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-text-tertiary">
                                {new Date(evt.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {evt.metadata && (
                              <div className="mt-3 bg-black/40 border border-black/50 rounded-lg p-3 overflow-x-auto">
                                <pre className={`text-[10px] font-mono ${isError ? 'text-red-300' : 'text-text-secondary'}`}>
                                  {JSON.stringify(evt.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {skipModalOpen && activeLog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSkipModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-card border border-border-subtle rounded-xl shadow-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Rerun Workflow</h3>
              <p className="text-sm text-text-secondary mb-4">Select any steps you want to skip during this rerun.</p>
              
              <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {(Array.isArray(activeLog.workflow?.nodesJson) ? activeLog.workflow.nodesJson : []).map(node => (
                  <label key={node.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <Checkbox 
                      checked={skippedNodes.includes(node.id)}
                      onChange={(checked) => {
                        if (checked) setSkippedNodes([...skippedNodes, node.id]);
                        else setSkippedNodes(skippedNodes.filter(id => id !== node.id));
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{node.title || node.type}</span>
                      <span className="text-xs text-text-secondary font-mono">{node.id}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setSkipModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">Cancel</button>
                <button onClick={() => handleRerunWorkflow(false)} disabled={isRerunning} className="px-4 py-2 text-sm font-medium bg-accent-blue text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50">
                  {isRerunning ? 'Starting...' : 'Start Rerun'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={skipWarningOpen}
        onClose={() => setSkipWarningOpen(false)}
        onConfirm={() => handleRerunWorkflow(true)}
        title="Warning: Dependency Risk"
        message="One or more of the steps you chose to skip are being referenced by other steps in this workflow. Skipping them may cause the workflow to fail due to missing data. Are you sure you want to skip these steps?"
        confirmText="Skip Anyway & Rerun"
        isDestructive={true}
      />
    </div>
  );
}
