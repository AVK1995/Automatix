'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  KeyRound, 
  Lock, 
  Crown, 
  Check, 
  Eye, 
  EyeOff, 
  Loader2, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Info,
  ExternalLink,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Database,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';
import { updateAiRadahnSettings, getAiConsumptionLogs } from './actions';
import Link from 'next/link';

const PROVIDER_OPTIONS = [
  {
    value: 'gemini',
    label: 'Google Gemini (Recommended - Fast & Web Grounded)',
    icon: <Sparkles size={14} className="text-cyan-400 shrink-0" />
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT-4o / GPT-4o-mini)',
    icon: <Zap size={14} className="text-emerald-400 shrink-0" />
  },
  {
    value: 'claude',
    label: 'Anthropic Claude (3.5 Sonnet / Haiku)',
    icon: <Cpu size={14} className="text-purple-400 shrink-0" />
  }
];

export default function AiRadahnSettingsForm({ user }) {
  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
  const [provider, setProvider] = useState(user?.aiRadahnProvider || 'gemini');
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(Boolean(user?.aiRadahnApiKey));
  const [engineMode, setEngineMode] = useState(isPaid ? (user?.aiRadahnEngineMode || 'native') : 'native');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null); // { mode, message }

  // Consumption Analytics State
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalTokens: 0, totalEvents: 0 });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    fetchConsumptionLogs();
  }, []);

  const fetchConsumptionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await getAiConsumptionLogs(25);
      if (data?.logs) {
        setLogs(data.logs);
        setSummary(data.summary || { totalCredits: 0, totalTokens: 0, totalEvents: 0 });
      }
    } catch (e) {
      console.warn('Failed to load AI consumption logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (engineMode === 'byok' && !isPaid) {
      return toast.error('True AI Brain (BYOK) is only available on Paid plans. Please upgrade.');
    }

    if (engineMode === 'byok' && !apiKey.trim() && !hasExistingKey) {
      return toast.error('Please enter your API Key to enable True AI Brain.');
    }

    setIsSaving(true);
    setSaveBanner(null);

    try {
      const res = await updateAiRadahnSettings({
        aiRadahnProvider: provider,
        aiRadahnApiKey: apiKey.trim() ? apiKey.trim() : undefined,
        aiRadahnEngineMode: engineMode
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      if (apiKey.trim()) {
        setHasExistingKey(true);
        setApiKey('');
      }

      setSaveBanner({
        mode: res.mode || engineMode,
        message: res.message || 'AI Radahn engine preferences updated successfully!'
      });

      toast.success(res.message || 'AI Radahn engine preferences updated successfully!');
      fetchConsumptionLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to update AI Radahn settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearKey = async () => {
    setIsSaving(true);
    try {
      const res = await updateAiRadahnSettings({
        aiRadahnProvider: provider,
        aiRadahnApiKey: '',
        aiRadahnEngineMode: 'native'
      });

      if (res?.error) throw new Error(res.error);

      setHasExistingKey(false);
      setApiKey('');
      setEngineMode('native');
      setSaveBanner({
        mode: 'native',
        message: 'Removed API key and reset to Native Core Brain.'
      });
      toast.success('Removed API key and reset to Native Core Brain.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Themed Save Confirmation Banner */}
        {saveBanner && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200 ${
            saveBanner.mode === 'byok'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-purple-950/30 border-purple-500/40 text-purple-300'
          }`}>
            <div className="p-1 rounded-md bg-white/10 shrink-0 mt-0.5">
              <CheckCircle2 size={16} className={saveBanner.mode === 'byok' ? 'text-emerald-400' : 'text-purple-400'} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-0.5 flex items-center gap-2">
                <span>{saveBanner.mode === 'byok' ? 'True AI Brain Verified & Active' : 'Native Core Brain Active'}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/10 font-mono">SAVED</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                {saveBanner.message}
              </p>
            </div>
          </div>
        )}

        {/* Mode Selection Cards */}
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            AI Radahn Engine Mode
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Option 1: Native Core Brain */}
            <div 
              onClick={() => setEngineMode('native')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                engineMode === 'native'
                  ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30'
                  : 'bg-black/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Cpu size={14} />
                    </div>
                    <span className="text-sm font-bold text-white">Native Core Brain</span>
                  </div>
                  {engineMode === 'native' && (
                    <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Autonomous design ontology, color harmonics, and copywriting frameworks. Instant zero-key response with standard AI credits.
                </p>
              </div>
              <span className="mt-3 text-[11px] font-semibold text-purple-300">
                Available on all plans
              </span>
            </div>

            {/* Option 2: True AI Brain (BYOK - Paid Only) */}
            <div 
              onClick={() => {
                if (isPaid) {
                  setEngineMode('byok');
                } else {
                  toast.error('True AI Brain (BYOK) is exclusively available for Paid subscribers.');
                }
              }}
              className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                !isPaid 
                  ? 'bg-black/30 border-white/5 opacity-70 cursor-not-allowed'
                  : engineMode === 'byok'
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30 cursor-pointer'
                    : 'bg-black/40 border-white/10 hover:border-white/20 cursor-pointer'
              }`}
            >
              {!isPaid && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                  <Crown size={11} /> PRO ONLY
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-sm font-bold text-white">True AI Brain (BYOK)</span>
                  </div>
                  {isPaid && engineMode === 'byok' && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Connect your personal API key (Gemini / OpenAI / Claude). Enables live verification, true LLM multi-turn reasoning, and complex instructions.
                </p>
              </div>

              {isPaid ? (
                <span className="mt-3 text-[11px] font-semibold text-emerald-400">
                  Paid Plan Feature Enabled
                </span>
              ) : (
                <Link 
                  href="/dashboard/billing" 
                  className="mt-3 text-[11px] font-bold text-accent-blue hover:underline inline-flex items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  Upgrade to unlock BYOK True AI <ExternalLink size={11} />
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* BYOK Configuration Section (Rendered ONLY when True AI Brain BYOK is selected) */}
        {engineMode === 'byok' && isPaid && (
          <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-white">BYOK Provider & Live Verification</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Your API key is stored securely in your private workspace and verified live before activation.
                </p>
              </div>
              {hasExistingKey && (
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck size={13} /> Key Verified & Active
                </span>
              )}
            </div>

            {/* Provider Select */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Select AI Engine Provider
              </label>
              <Select
                value={provider}
                onChange={setProvider}
                options={PROVIDER_OPTIONS}
                className="w-full"
              />
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-text-secondary">
                  {provider === 'gemini' ? 'Google Gemini API Key' : provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
                </label>
                {hasExistingKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    disabled={isSaving}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer transition-colors"
                  >
                    Remove Saved Key
                  </button>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                  <KeyRound size={15} />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasExistingKey ? '•••••••••••••••••••••••••••••••• (Leave blank to keep existing key)' : 'Enter your API key (e.g. AIzaSy... or sk-...)'}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-tertiary hover:text-white transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <p className="text-[11px] text-text-tertiary mt-1.5 flex items-center gap-1">
                <Info size={12} className="shrink-0" />
                Live verification tests your key against official provider endpoints. Capped at 1,200 tokens to ensure minimal provider cost.
              </p>
            </div>

          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-indigo-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying & Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save AI Radahn Settings</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* 2. Detailed AI Credit & Token Consumption Analytics */}
      <div className="pt-6 border-t border-white/10 space-y-4">
        
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              AI Credit & Token Consumption Analytics
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Complete audit log of AI Radahn executions, credit deductions, and provider token usage with 1-click navigation.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchConsumptionLogs}
            disabled={isLoadingLogs}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoadingLogs ? 'animate-spin' : ''} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">AI Credits Used</div>
              <div className="text-base font-bold text-white">{summary.totalCredits} Credits</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Activity size={16} />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">BYOK Tokens Consumed</div>
              <div className="text-base font-bold text-white">{summary.totalTokens.toLocaleString()} Tokens</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <div className="text-[11px] text-text-secondary font-medium">Total AI Tasks Executed</div>
              <div className="text-base font-bold text-white">{summary.totalEvents} Events</div>
            </div>
          </div>

        </div>

        {/* Audit Log Table */}
        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
          {isLoadingLogs ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-tertiary gap-2">
              <Loader2 size={20} className="animate-spin text-purple-400" />
              <span className="text-xs">Loading consumption audit records...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 px-4 text-center text-text-tertiary text-xs space-y-1.5">
              <Database size={24} className="mx-auto opacity-40 mb-1" />
              <p className="text-white font-semibold">No AI executions recorded yet.</p>
              <p>As you draft email templates, refine workflow copies, or customize calendars, your token & credit consumption will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-text-secondary font-semibold">
                  <tr>
                    <th className="p-3">Target & Operation</th>
                    <th className="p-3">Engine Mode</th>
                    <th className="p-3">Tokens Consumed</th>
                    <th className="p-3">AI Credits</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {log.targetUrl ? (
                            <Link 
                              href={log.targetUrl}
                              className="text-white hover:text-accent-blue inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{log.targetTitle || log.operation}</span>
                              <ArrowUpRight size={12} className="text-accent-blue shrink-0" />
                            </Link>
                          ) : (
                            <span>{log.targetTitle || log.operation}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-tertiary font-mono uppercase mt-0.5">
                          {log.operation.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="p-3">
                        {log.engineMode === 'BYOK' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            True AI ({log.provider || 'BYOK'})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Native Core Brain
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {log.engineMode === 'BYOK' ? (
                          <div className="font-mono text-[11px] text-emerald-300">
                            {log.totalTokens > 0 ? `${log.totalTokens} Tokens` : 'Zero Token Waste'}
                          </div>
                        ) : (
                          <div className="font-mono text-[11px] text-text-tertiary">
                            Zero Token Drain (Native)
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-white">-{log.creditsUsed} Credit</span>
                      </td>
                      <td className="p-3 text-right text-text-tertiary font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
