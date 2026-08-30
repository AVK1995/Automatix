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
  CheckCircle2,
  Calendar,
  Filter,
  ShieldAlert,
  Plus,
  Trash2,
  Download,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';
import { 
  updateAiRadahnSettings, 
  getAiConsumptionLogs, 
  getAiRadahnKeys, 
  saveAiRadahnKey, 
  deleteAiRadahnKey 
} from './actions';
import Link from 'next/link';

const PROVIDER_OPTIONS = [
  {
    value: 'gemini',
    label: 'Google Gemini (Recommended - Multimodal & Fast)',
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

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Active (Up to 90 Days)' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days (Max Retention)' },
  { value: 'custom', label: 'Custom Date Range...' }
];

export default function AiRadahnSettingsForm({ user }) {
  const isPaid = user?.subscriptionTier && user.subscriptionTier.toLowerCase() !== 'free';
  const [engineMode, setEngineMode] = useState(user?.aiRadahnEngineMode || 'native');
  const [savedKeys, setSavedKeys] = useState([]);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [saveBanner, setSaveBanner] = useState(null);

  // New Key Modal / Inline State
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState('gemini');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyIsDefault, setNewKeyIsDefault] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [isTestingAndSaving, setIsTestingAndSaving] = useState(false);

  // Consumption Analytics State
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalTokens: 0, totalEvents: 0 });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [keyFilter, setKeyFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    fetchConsumptionLogs();
  }, [dateRange, keyFilter, startDate, endDate]);

  const fetchKeys = async () => {
    try {
      const data = await getAiRadahnKeys();
      if (data?.keys) {
        setSavedKeys(data.keys);
      }
    } catch (e) {
      console.warn('Could not fetch AI keys:', e);
    }
  };

  const fetchConsumptionLogs = async () => {
    setIsLoadingLogs(true);
    try {
      let filterStart = null;
      let filterEnd = null;

      const now = new Date();
      if (dateRange === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filterStart = todayStart.toISOString();
      } else if (dateRange === '7d') {
        filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '30d') {
        filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '90d' || dateRange === 'all') {
        filterStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === 'custom') {
        if (startDate) filterStart = startDate;
        if (endDate) filterEnd = endDate;
      }

      const data = await getAiConsumptionLogs({
        limit: 100,
        startDate: filterStart,
        endDate: filterEnd,
        keyName: keyFilter !== 'all' ? keyFilter : undefined
      });

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

  // Provider Key Counters
  const geminiKeys = savedKeys.filter(k => (k.provider || 'gemini').toLowerCase() === 'gemini');
  const openaiKeys = savedKeys.filter(k => (k.provider || '').toLowerCase() === 'openai');
  const claudeKeys = savedKeys.filter(k => (k.provider || '').toLowerCase() === 'claude');

  const handleSaveMode = async (targetMode) => {
    if (!isPaid) {
      return toast.error('AI Radahn Engine is exclusively available for Paid subscribers. Please upgrade.');
    }

    if (targetMode === 'byok' && savedKeys.length === 0) {
      return toast.error('Please add at least one verified API key to your vault before enabling True AI Brain.');
    }

    setIsSavingMode(true);
    setSaveBanner(null);

    try {
      const res = await updateAiRadahnSettings({
        aiRadahnEngineMode: targetMode
      });

      if (res?.error) throw new Error(res.error);

      setEngineMode(targetMode);
      setSaveBanner({
        mode: targetMode,
        message: targetMode === 'byok' 
          ? 'True AI Brain BYOK active with verified vault credentials.' 
          : 'AI Radahn Native Core Brain activated. Ready for instant generations.'
      });

      toast.success(res.message || 'Preferences updated!');
      fetchConsumptionLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to update mode');
    } finally {
      setIsSavingMode(false);
    }
  };

  const handleAddNewKey = async (e) => {
    e.preventDefault();
    if (!newKeyValue.trim()) {
      return toast.error('Please enter an API key.');
    }

    const currentCount = newKeyProvider === 'gemini' 
      ? geminiKeys.length 
      : newKeyProvider === 'openai' 
        ? openaiKeys.length 
        : claudeKeys.length;

    if (currentCount >= 3) {
      return toast.error(`Maximum 3 keys allowed for ${newKeyProvider.toUpperCase()}. Please delete an existing key first.`);
    }

    setIsTestingAndSaving(true);
    try {
      const res = await saveAiRadahnKey({
        name: newKeyName.trim() || `${newKeyProvider.toUpperCase()} Key ${currentCount + 1}`,
        provider: newKeyProvider,
        apiKey: newKeyValue.trim(),
        isDefault: newKeyIsDefault || savedKeys.length === 0
      });

      if (res?.error) throw new Error(res.error);

      toast.success(res.message || 'Key verified and saved to vault!');
      setNewKeyName('');
      setNewKeyValue('');
      setNewKeyIsDefault(false);
      setIsAddingKey(false);
      await fetchKeys();
      fetchConsumptionLogs();
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsTestingAndSaving(false);
    }
  };

  const handleDeleteKey = async (keyId, keyName) => {
    if (!window.confirm(`Are you sure you want to remove API key "${keyName}" from your vault?`)) {
      return;
    }

    try {
      const res = await deleteAiRadahnKey(keyId);
      if (res?.error) throw new Error(res.error);
      toast.success('Key removed from vault.');
      await fetchKeys();
      fetchConsumptionLogs();
    } catch (err) {
      toast.error(err.message || 'Failed to delete key');
    }
  };

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      return toast.error('No analytics records found to export.');
    }

    const headers = ['Timestamp', 'Operation', 'Engine Mode', 'Provider', 'Target / Workflow', 'Credits Used', 'Total Tokens', 'Status'];
    const rows = logs.map(l => [
      `"${new Date(l.createdAt).toLocaleString()}"`,
      `"${l.operation || 'AI_GENERATION'}"`,
      `"${l.engineMode || 'NATIVE'}"`,
      `"${(l.provider || 'gemini').toUpperCase()}"`,
      `"${(l.targetTitle || 'Workflow Execution').replace(/"/g, '""')}"`,
      l.creditsUsed || 1,
      l.totalTokens || 0,
      '"SUCCESS"'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_radahn_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported to CSV!');
  };

  // Build key options for analytics filtering
  const keyFilterOptions = [
    { value: 'all', label: 'All Vault Keys & Native Brain' },
    ...savedKeys.map(k => ({
      value: k.name,
      label: `${k.name} (${k.provider.toUpperCase()})`
    }))
  ];

  return (
    <div className="space-y-8">
      
      {/* If User is on Free Plan, show exclusive PRO lock */}
      {!isPaid ? (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/30 via-black to-black border border-purple-500/30 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Radahn Engine (PRO Feature)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown size={11} /> PAID SUBSCRIBERS ONLY
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                AI Radahn is an exclusive intelligence layer available on Paid plans. Free plans do not have access to AI engines.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">Unlock AI Radahn Key Vault & BYOK Models</div>
              <div className="text-[11px] text-text-secondary">
                Includes automated workflow email design, multimodal vision analysis, and multi-key vault management.
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 shrink-0 transition-all"
            >
              <span>Upgrade to Paid Plan</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        /* Paid Users Configuration Form */
        <div className="space-y-6">

          {/* Success Banner */}
          {saveBanner && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-300 ${
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
                onClick={() => handleSaveMode('native')}
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
                  Paid Plan Feature Active
                </span>
              </div>

              {/* Option 2: True AI Brain (BYOK) */}
              <div 
                onClick={() => handleSaveMode('byok')}
                className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                  engineMode === 'byok'
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Sparkles size={14} />
                      </div>
                      <span className="text-sm font-bold text-white">True AI Brain (BYOK Vault)</span>
                    </div>
                    {engineMode === 'byok' && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Connect up to 3 API keys per model (Gemini / OpenAI / Claude). Enables live verification, multi-turn reasoning, and complex instructions.
                  </p>
                </div>

                <span className="mt-3 text-[11px] font-semibold text-emerald-400">
                  {savedKeys.length > 0 ? `${savedKeys.length} Vault Keys Configured` : 'Add Vault Keys Below'}
                </span>
              </div>

            </div>
          </div>

          {/* Active Workflow Notice when switching to Native */}
          {engineMode === 'native' && savedKeys.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 animate-in fade-in duration-200">
              <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Active Workflow Notice:</span>
                <p className="mt-0.5 text-amber-200/90 text-[11px] leading-relaxed">
                  Switching to Native Core Brain will pause external BYOK key execution. Workflows configured to use the Central Key Vault will operate via the AI Radahn Vision Encoder instead.
                </p>
              </div>
            </div>
          )}

          {/* Multi-Key Vault Management Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">AI Radahn Key Vault (Max 3 Keys Per Model)</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {savedKeys.length} Keys Active
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Name and register your keys to select them directly inside your workflow steps.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingKey(!isAddingKey)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add New API Key</span>
              </button>
            </div>

            {/* Quota Indicators per Model */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-cyan-400" />
                  <span className="text-white font-medium">Google Gemini</span>
                </div>
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                  geminiKeys.length >= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'
                }`}>
                  {geminiKeys.length}/3 Keys
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-emerald-400" />
                  <span className="text-white font-medium">OpenAI GPT</span>
                </div>
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                  openaiKeys.length >= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                }`}>
                  {openaiKeys.length}/3 Keys
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cpu size={13} className="text-purple-400" />
                  <span className="text-white font-medium">Anthropic Claude</span>
                </div>
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                  claudeKeys.length >= 3 ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/10 text-purple-300'
                }`}>
                  {claudeKeys.length}/3 Keys
                </span>
              </div>
            </div>

            {/* Add Key Form */}
            {isAddingKey && (
              <form onSubmit={handleAddNewKey} className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <KeyRound size={13} /> Add & Verify New Vault Key
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingKey(false)}
                    className="text-xs text-text-tertiary hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Key Name (e.g. Gemini Prod Primary)</label>
                    <input
                      type="text"
                      placeholder="e.g. Gemini Production Flash"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">AI Provider</label>
                    <Select
                      value={newKeyProvider}
                      onChange={setNewKeyProvider}
                      options={PROVIDER_OPTIONS}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-secondary">
                      {newKeyProvider === 'gemini' ? 'Google Gemini API Key' : newKeyProvider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className="text-[11px] text-text-tertiary hover:text-white"
                    >
                      {showNewKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    placeholder={newKeyProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                    value={newKeyValue}
                    onChange={e => setNewKeyValue(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={newKeyIsDefault}
                      onChange={e => setNewKeyIsDefault(e.target.checked)}
                      className="rounded bg-black/60 border-white/20 text-purple-600 focus:ring-0 shrink-0"
                    />
                    <span>Set as primary default key for this provider</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isTestingAndSaving || !newKeyValue.trim()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    {isTestingAndSaving ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                    <span>{isTestingAndSaving ? 'Verifying Live...' : 'Verify & Save Key'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Configured Keys */}
            {savedKeys.length > 0 ? (
              <div className="space-y-2">
                {savedKeys.map((k) => (
                  <div 
                    key={k.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {k.provider === 'gemini' ? (
                          <Sparkles size={15} className="text-cyan-400" />
                        ) : k.provider === 'openai' ? (
                          <Zap size={15} className="text-emerald-400" />
                        ) : (
                          <Cpu size={15} className="text-purple-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">{k.name}</span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-white/10 text-white/80">
                            {k.provider}
                          </span>
                          {k.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Star size={9} fill="currentColor" /> DEFAULT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-tertiary mt-0.5 font-mono">
                          <span>{k.maskedKey || '••••••••••••'}</span>
                          <span>•</span>
                          <span>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : 'Active'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(k.id, k.name)}
                        className="p-1.5 text-text-tertiary hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-black/30 border border-dashed border-white/10 text-center space-y-2">
                <KeyRound size={24} className="mx-auto text-text-tertiary" />
                <p className="text-xs text-text-secondary font-medium">No custom API keys added to your vault yet.</p>
                <p className="text-[11px] text-text-tertiary">
                  Click "Add New API Key" above to connect your Gemini, OpenAI, or Claude credentials.
                </p>
              </div>
            )}
          </div>

          {/* Real-time Analytics & Audit Table */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-400" />
                  <span>AI Radahn Analytics & Token Audit</span>
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Detailed consumption tracking per key and workflow execution (Retained up to 90 days).
                </p>
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-text-secondary hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm self-start sm:self-auto cursor-pointer"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Filter Bar: Key Selector & Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
              
              {/* Filter by Key */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Filter by Key / Model</label>
                <Select
                  value={keyFilter}
                  onChange={setKeyFilter}
                  options={keyFilterOptions}
                  className="w-full"
                />
              </div>

              {/* Filter by Date Range */}
              <div>
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">Date Range</label>
                <Select
                  value={dateRange}
                  onChange={setDateRange}
                  options={DATE_RANGE_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Custom Date Inputs if 'custom' is selected */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                  <div className="flex-1">
                    <label className="block text-[10px] text-text-tertiary mb-1">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-text-tertiary mb-1">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Credits Consumed</span>
                <p className="text-base sm:text-lg font-bold font-mono text-purple-300 mt-0.5">{summary.totalCredits}</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Total Tokens</span>
                <p className="text-base sm:text-lg font-bold font-mono text-cyan-300 mt-0.5">{summary.totalTokens.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Inference Events</span>
                <p className="text-base sm:text-lg font-bold font-mono text-emerald-300 mt-0.5">{summary.totalEvents}</p>
              </div>
            </div>

            {/* Log Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {isLoadingLogs ? (
                  <div className="p-8 text-center text-text-tertiary flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                    <span>Loading consumption audit records...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-text-tertiary text-xs">
                    No consumption records found for the selected filter range.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] border-b border-white/5 text-[10px] uppercase text-text-tertiary font-mono tracking-wider sticky top-0 bg-black/90 backdrop-blur-sm z-10">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Operation / Workflow</th>
                        <th className="p-3">Engine / Key</th>
                        <th className="p-3 text-right">Tokens</th>
                        <th className="p-3 text-right">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 font-mono text-text-tertiary whitespace-nowrap text-[11px]">
                            {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-medium text-white max-w-[200px] truncate" title={log.targetTitle || log.operation}>
                            {log.targetTitle || log.operation}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                              log.engineMode === 'BYOK' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {log.provider || log.engineMode}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-text-secondary whitespace-nowrap">
                            {log.totalTokens ? log.totalTokens.toLocaleString() : '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-purple-300 font-semibold whitespace-nowrap">
                            {log.creditsUsed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
