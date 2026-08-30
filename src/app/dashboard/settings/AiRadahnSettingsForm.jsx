'use client';

import { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';
import { updateAiRadahnSettings } from './actions';
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

  const handleSave = async (e) => {
    e.preventDefault();

    if (engineMode === 'byok' && !isPaid) {
      return toast.error('True AI Brain (BYOK) is only available on Paid plans. Please upgrade.');
    }

    if (engineMode === 'byok' && !apiKey.trim() && !hasExistingKey) {
      return toast.error('Please enter your API Key to enable True AI Brain.');
    }

    setIsSaving(true);
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

      toast.success('AI Radahn engine preferences updated successfully!');
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
      toast.success('Removed API key and reset to Native Core Brain.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
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
                ? 'bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/30'
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
                Deterministic rule & theme matrix. Instant response with zero external key required. Consumes standard AI task credits.
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
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30 cursor-pointer'
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
                Connect your personal API key (Gemini / OpenAI / Claude). Enables dynamic web grounding, genuine multi-turn reasoning, and complex instructions.
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

      {/* BYOK Configuration Section (Shown when BYOK mode is selected or if Paid) */}
      <div className={`space-y-4 pt-4 border-t border-white/10 ${engineMode !== 'byok' && !isPaid ? 'opacity-50 pointer-events-none' : ''}`}>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">BYOK Provider & Credentials</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Your API key is stored securely in your private workspace and used strictly for your AI Radahn requests.
            </p>
          </div>
          {hasExistingKey && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck size={13} /> Key Configured
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
            disabled={!isPaid}
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
              disabled={!isPaid}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
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
            Strict output rules and token limits (1,200 max tokens) ensure minimal token consumption on your provider account.
          </p>
        </div>

      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSaving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving Preferences...</>
          ) : (
            <><Check size={14} /> Save AI Radahn Settings</>
          )}
        </button>
      </div>

    </form>
  );
}
