import { motion } from 'framer-motion';
import { X, History, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import ExecutionDetailModal from './ExecutionDetailModal';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ExecutionHistoryPanel({ onClose, workflowId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecution, setSelectedExecution] = useState(null);

  const fetcher = (url) => fetch(url).then((res) => res.json());
  const { data, error, isLoading } = useSWR(`/api/workflows/${workflowId}/history`, fetcher, {
    refreshInterval: 5000 // auto-refresh every 5s
  });

  const history = data?.logs?.map(log => {
    // Parse duration if we have startedAt/finishedAt, etc.
    let timeAgo = 'Just now';
    try { timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }); } catch(e) {}
    
    // Attempt to reconstruct steps from currentNodeState or analyticsEvents if they existed, but fallback to empty for now
    let steps = [];
    if (log.analyticsEvents?.length > 0) {
       steps = log.analyticsEvents.map(e => ({
         id: e.id,
         name: e.eventType,
         status: 'COMPLETED',
         input: e.metadata,
         output: null
       }));
    } else {
       // Extract trigger payload if available
       let triggerPayload = {};
       if (log.currentNodeState && typeof log.currentNodeState === 'object') {
          triggerPayload = log.currentNodeState.payload || {};
       }
       
       steps = [
         { id: 'start', name: 'Trigger', status: 'COMPLETED', input: triggerPayload, output: triggerPayload }
       ];
       if (log.status === 'FAILED') {
         steps.push({ id: 'fail', name: 'Error', status: 'FAILED', error: 'Execution failed', input: {}, output: {} });
       }
    }

    return {
      id: log.id,
      status: log.status,
      time: timeAgo,
      duration: 'N/A', // Update if we track duration later
      error: log.status === 'FAILED' ? 'Execution failed' : null,
      steps
    };
  }) || [];

  const filteredHistory = history.filter(run => 
    run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (run.error && run.error.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRetry = (execution) => {
    fetch(`/api/workflows/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, executionLogId: execution.id })
    }).then(() => alert(`Retrying execution ${execution.id}`));
  };

  return (
    <>
      <div className="h-full w-[360px] bg-[#0a0a0a] border-l border-border-subtle flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] absolute right-0 top-0 z-20">
        <div className="p-4 border-b border-border-subtle bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-accent-blue" />
                Execution History
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">Recent automated runs.</p>
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-white p-1 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search by ID or error..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredHistory.map((run) => (
            <div 
              key={run.id} 
              onClick={() => setSelectedExecution(run)}
              className="p-3 bg-card border border-border-subtle rounded-md hover:border-accent-blue/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                  (run.status === 'ACTIVE' || run.status === 'WAITING') ? 'bg-accent-blue/10 text-accent-blue' : 
                  'bg-red-500/10 text-red-400'
                }`}>
                  {run.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : 
                   (run.status === 'ACTIVE' || run.status === 'WAITING') ? <Clock className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {run.status}
                </span>
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {run.time}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-1">ID: <span className="font-mono text-white/60">{run.id}</span></p>
              <p className="text-[11px] text-text-secondary">Duration: {run.duration}</p>
              {run.error && (
                <div className="mt-2 text-[10px] text-red-400 bg-red-400/10 p-2 rounded-sm border border-red-400/20 line-clamp-2">
                  {run.error}
                </div>
              )}
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <div className="text-center text-xs text-text-secondary py-8">
              No executions found.
            </div>
          )}
        </div>
      </div>

      <ExecutionDetailModal 
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        execution={selectedExecution}
        onRetry={handleRetry}
      />
    </>
  );
}
