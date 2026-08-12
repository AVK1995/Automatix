import { motion } from 'framer-motion';
import { X, History, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import ExecutionDetailModal from './ExecutionDetailModal';

export default function ExecutionHistoryPanel({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExecution, setSelectedExecution] = useState(null);

  // Mock data for execution history with step-by-step details
  const history = [
    { 
      id: 'ex_1', 
      status: 'COMPLETED', 
      time: 'Just now', 
      duration: '1.2s',
      steps: [
        { id: 'step_1', name: 'Catch Webhook', status: 'COMPLETED', input: {}, output: { email: 'test@gmail.com' } },
        { id: 'step_2', name: 'API by Automatix', status: 'COMPLETED', input: { email: 'test@gmail.com' }, output: { success: true } }
      ]
    },
    { 
      id: 'ex_2', 
      status: 'FAILED', 
      time: '2 hours ago', 
      duration: '0.8s', 
      error: 'Invalid webhook payload structure',
      steps: [
        { id: 'step_1', name: 'Catch Webhook', status: 'COMPLETED', input: {}, output: { email: null } },
        { id: 'step_2', name: 'API by Automatix', status: 'FAILED', error: 'Missing email', input: { email: null }, output: null }
      ]
    },
    { 
      id: 'ex_3', 
      status: 'COMPLETED', 
      time: 'Yesterday', 
      duration: '1.5s',
      steps: [
        { id: 'step_1', name: 'Catch Webhook', status: 'COMPLETED', input: {}, output: { email: 'user@example.com' } }
      ]
    },
    { 
      id: 'ex_4', 
      status: 'COMPLETED', 
      time: '2 days ago', 
      duration: '1.1s',
      steps: [
        { id: 'step_1', name: 'Catch Webhook', status: 'COMPLETED', input: {}, output: { email: 'hello@world.com' } }
      ]
    },
  ];

  const filteredHistory = history.filter(run => 
    run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (run.error && run.error.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRetry = (execution) => {
    // In a real app, this would trigger an API call to re-run from the failed step
    alert(`Retrying execution ${execution.id} starting from failed steps.`);
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
                  run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {run.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
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
