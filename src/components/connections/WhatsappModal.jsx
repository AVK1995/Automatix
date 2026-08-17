'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Phone, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import { useRouter } from 'next/navigation';

export default function WhatsappModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formData, setFormData] = useState({
    connectionName: '',
    appId: '',
    appSecret: '',
    pageAccessToken: '' // Technically WhatsApp Business Token
  });
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (initialData) {
      setFormData({
        connectionName: initialData.name || '',
        appId: initialData.clientEmail || '',
        appSecret: initialData.privateKey || '',
        pageAccessToken: initialData.apiKey || ''
      });
    }
  }, [initialData]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.connectionName.trim() || !formData.appId.trim() || !formData.appSecret.trim() || !formData.pageAccessToken.trim()) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/integrations/meta/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: 'whatsapp',
          connectionName: formData.connectionName,
          appId: formData.appId,
          appSecret: formData.appSecret,
          pageAccessToken: formData.pageAccessToken
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to connect WhatsApp account.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
      onSuccess(data.integrationId);
      router.refresh();
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border text-green-500 bg-green-500/10 border-green-500/20">
              <Phone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect WhatsApp</h2>
              <p className="text-xs text-text-secondary">Add a new WhatsApp Business connection</p>
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
              Enter your Meta App credentials to connect your WhatsApp Business account.
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

          <form id="whatsapp-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Connection Name</label>
              <input
                type="text"
                value={formData.connectionName}
                onChange={(e) => setFormData({...formData, connectionName: e.target.value})}
                placeholder="e.g. My WA Bot"
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Meta App ID</label>
              <input
                type="text"
                value={formData.appId}
                onChange={(e) => setFormData({...formData, appId: e.target.value})}
                placeholder="e.g. 123456789012345"
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Meta App Secret</label>
              <input
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData({...formData, appSecret: e.target.value})}
                placeholder="Paste your App Secret here..."
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">System User Token (Permanent)</label>
              <input
                type="password"
                value={formData.pageAccessToken}
                onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})}
                placeholder="Paste your permanent access token here..."
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
            form="whatsapp-form"
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
        providerName="WhatsApp"
      />
    </div>,
    document.body
  );
}
