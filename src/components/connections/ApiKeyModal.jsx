'use client';

import { useState, useEffect } from 'react';
import { connectWithApiKey } from '@/actions/connections';
import { X, Loader2, Calendar, HelpCircle, Link2, MessageSquare, DollarSign, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';

const PROVIDER_CONFIG = {
  'Calendly': {
    icon: Calendar,
    colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'Connect Calendly',
    subtitle: 'Add a new Calendly connection',
    tokenLabel: 'Personal Access Token',
    tokenPlaceholder: 'Paste your Personal Access Token here...',
    emailLabel: 'Account Email',
    emailPlaceholder: 'e.g. you@example.com'
  },
  'Cal.com': {
    icon: Calendar,
    colorClass: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    title: 'Connect Cal.com',
    subtitle: 'Add a new Cal.com connection',
    tokenLabel: 'API Key',
    tokenPlaceholder: 'Paste your API Key here...',
    emailLabel: 'Account Email',
    emailPlaceholder: 'e.g. you@example.com'
  }
};

export default function ApiKeyModal({ isOpen, onClose, onSuccess, providerName }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    apiKey: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when provider changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', apiKey: '' });
      setError(null);
    }
  }, [isOpen, providerName]);

  if (!isOpen || !mounted || !providerName) return null;

  const config = PROVIDER_CONFIG[providerName] || {
    icon: Link2,
    colorClass: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    title: `Connect ${providerName}`,
    subtitle: `Add a new ${providerName} connection`,
    tokenLabel: 'API Key',
    tokenPlaceholder: 'Paste your API Key here...',
    emailLabel: 'Account Email',
    emailPlaceholder: 'e.g. you@example.com'
  };

  const IconComponent = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.apiKey.trim()) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }

      const result = await connectWithApiKey(providerName, formData.name, formData.apiKey, formData.email);
      
      if (result && !result.success) {
        setError(result.error || `Failed to connect ${providerName} account.`);
        setLoading(false);
        return;
      }
      
      setLoading(false);
      onSuccess(result.id);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while connecting.');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-[#0f0f0f] border border-border-subtle rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-border-subtle flex justify-between items-center bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${config.colorClass}`}>
              <IconComponent size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{config.title}</h2>
              <p className="text-xs text-text-secondary">{config.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-text-secondary">
              Enter your API credentials to connect.
            </p>
            <button 
              type="button" 
              onClick={() => setIsGuideOpen(true)} 
              className="text-[11px] text-accent-blue hover:underline flex items-center gap-1 shrink-0"
            >
              <HelpCircle className="w-3 h-3" /> Setup Guide
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <form id="apikey-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Connection Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. My Connection"
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{config.emailLabel}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder={config.emailPlaceholder}
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{config.tokenLabel}</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                placeholder={config.tokenPlaceholder}
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors font-mono"
                required
              />
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 border-t border-border-subtle bg-[#151515] flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="apikey-form"
            className="bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Connecting...</>
            ) : (
              'Connect Account'
            )}
          </button>
        </div>
      </div>

      <ConnectionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        providerName={providerName}
      />
    </div>,
    document.body
  );
}
