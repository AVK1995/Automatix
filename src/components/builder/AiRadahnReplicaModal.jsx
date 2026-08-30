'use client';

import { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  X, 
  Loader2, 
  ShieldCheck, 
  Database,
  Layers,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';

const LOOKBACK_OPTIONS = [
  { value: '1', label: 'Past 24 Hours (Recent Leads)' },
  { value: '3', label: 'Past 3 Days' },
  { value: '7', label: 'Past 7 Days (Recommended for Weekly Sprints)' },
  { value: '14', label: 'Past 14 Days (Bi-Weekly Cohorts)' },
  { value: '30', label: 'Past 30 Days (Monthly Challenge)' }
];

export default function AiRadahnReplicaModal({
  isOpen,
  onClose,
  workflowId,
  workflowName = 'Workflow Automation',
  nodeData = {},
  onReplicaConfigured
}) {
  const [lookbackDays, setLookbackDays] = useState('7');
  const [reshootMode, setReshootMode] = useState('recalculate_dates');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  if (!isOpen) return null;

  const handleReshoot = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch(`/api/workflows/${workflowId}/ai-replica-reshoot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookbackDays: Number(lookbackDays),
          reshootMode,
          nodeId: nodeData?.id || 'sheet_lookup_node',
          nodeTitle: nodeData?.title || 'Google Sheet Lookup'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to deploy AI Radahn replica reshoot');
      }

      setExecutionResult(data);
      toast.success(`AI Radahn Replica deployed! ${data.reshotCount || 0} runs resynchronized.`);
      
      if (onReplicaConfigured) {
        onReplicaConfigured({
          enabled: true,
          lookbackDays: Number(lookbackDays),
          reshootMode,
          lastRunAt: new Date().toISOString()
        });
      }
    } catch (err) {
      toast.error(err.message || 'Replica reshoot failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0 mt-0.5">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  AI Radahn Replica Watcher
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRO Engine
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Autonomous watcher for dynamic Google Sheet dates & variables. Automatically reshoots downstream reminder sequences.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-text-tertiary hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
          
          {/* Target Node Badge */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={15} className="text-emerald-400 shrink-0" />
              <span className="font-medium text-white text-xs">Watching Target:</span>
              <span className="text-xs font-mono text-emerald-300">{nodeData?.title || 'Google Sheet Lookup Node'}</span>
            </div>
            <span className="text-[10px] font-semibold text-text-tertiary uppercase">Active Node</span>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Past Lookback Range for User Captures
              </label>
              <Select
                value={lookbackDays}
                onChange={setLookbackDays}
                options={LOOKBACK_OPTIONS}
                className="w-full text-xs"
              />
              <p className="text-[11px] text-text-tertiary mt-1">
                AI Radahn will look back across all captured workflow executions within this window and recalculate their dynamic timestamps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Reshoot Execution Action
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="radio"
                    name="reshootMode"
                    value="recalculate_dates"
                    checked={reshootMode === 'recalculate_dates'}
                    onChange={() => setReshootMode('recalculate_dates')}
                    className="mt-0.5 text-purple-500 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Recalculate Dynamic Timestamps & Reschedule Reminders</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      Pulls newly updated dates/times from Google Sheets and adjusts all upcoming 1-hour and 15-minute reminder dispatches.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                  <input
                    type="radio"
                    name="reshootMode"
                    value="resend_updated_welcome"
                    checked={reshootMode === 'resend_updated_welcome'}
                    onChange={() => setReshootMode('resend_updated_welcome')}
                    className="mt-0.5 text-purple-500 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Resend Updated Schedule Passes Only</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      Sends an instant update email with the revised event calendar to all enrolled participants.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* AI Credit Notice */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
              <Zap size={15} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Consumption Notice:</span> Deploying this replica and reshooting matching executions will deduct <strong className="text-white">1 AI Credit</strong> and will be logged in your AI Analytics audit trail.
              </div>
            </div>

            {/* Execution Result Banner */}
            {executionResult && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Replica Deployed Successfully!</div>
                  <div className="text-white/80 mt-0.5">
                    {executionResult.message || `Resynchronized ${executionResult.reshotCount || 0} workflow runs with updated sheet variables.`}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleReshoot}
            disabled={isExecuting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Scanning Runs & Reshooting...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Deploy Replica & Reshoot Workflow</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
