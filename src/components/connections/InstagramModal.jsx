'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Camera, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import { useRouter } from 'next/navigation';

export default function InstagramModal({ isOpen, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formData, setFormData] = useState({
    connectionName: '',
    appId: '',
    appSecret: '',
    pageAccessToken: ''
  });
  const [error, setError] = useState(null);
  const [metaSetupMode, setMetaSetupMode] = useState('self-serve');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleConciergeRequest = async () => {
    setLoading(true);
    setError(null);
    try {
       const { submitRefundRequest } = await import('@/actions/support');
       const res = await submitRefundRequest(`Concierge Setup: Instagram`, `Client requested a white-glove setup for Instagram. Please contact them for Business Manager access.`);
       if (res.success) {
          alert('Request submitted! Our team will reach out to you shortly.');
          onClose();
       } else {
          setError(res.error || 'Failed to submit request');
       }
    } catch (e) {
       setError('Something went wrong');
    }
    setLoading(false);
  };

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
          providerName: 'instagram',
          connectionName: formData.connectionName,
          appId: formData.appId,
          appSecret: formData.appSecret,
          pageAccessToken: formData.pageAccessToken
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to connect Instagram account.');
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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border text-pink-600 bg-pink-600/10 border-pink-600/20">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connect Instagram</h2>
              <p className="text-xs text-text-secondary">Add a new Instagram Bot connection</p>
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
              Enter your Meta App credentials to connect your Instagram account.
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

          <div className="grid grid-cols-2 gap-3 mb-4">
             <button 
               type="button" 
               className={`p-3 text-left border rounded-lg transition-colors ${metaSetupMode === 'self-serve' ? 'border-accent-blue bg-accent-blue/10' : 'border-border-subtle hover:border-white/20'}`}
               onClick={() => setMetaSetupMode('self-serve')}
             >
               <h5 className="text-sm font-semibold text-white mb-1">Self-Serve</h5>
               <p className="text-xs text-text-tertiary">Provide your App ID & Secret.</p>
             </button>
             <button 
               type="button" 
               className={`p-3 text-left border rounded-lg transition-colors ${metaSetupMode === 'concierge' ? 'border-accent-blue bg-accent-blue/10' : 'border-border-subtle hover:border-white/20'}`}
               onClick={() => setMetaSetupMode('concierge')}
             >
               <h5 className="text-sm font-semibold text-white mb-1">Concierge Setup</h5>
               <p className="text-xs text-text-tertiary">We handle the technical setup.</p>
             </button>
          </div>

          {metaSetupMode === 'self-serve' && (
            <form id="instagram-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Connection Name</label>
              <input
                type="text"
                value={formData.connectionName}
                onChange={(e) => setFormData({...formData, connectionName: e.target.value})}
                placeholder="e.g. My Insta Bot"
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
                <label className="block text-sm font-medium text-text-secondary mb-1">Access Token</label>
                <input
                  type="password"
                  value={formData.pageAccessToken}
                  onChange={(e) => setFormData({...formData, pageAccessToken: e.target.value})}
                  placeholder="Paste your generated token here..."
                  className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors font-mono"
                  required
                />
              </div>
            </form>
          )}

          {metaSetupMode === 'concierge' && (
             <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center space-y-4">
                <p className="text-sm text-text-secondary">By submitting a Concierge Request, our infrastructure team will reach out to you via your registered email to get partner access to your Meta Business Manager. We will handle all the webhooks, tokens, and app creation securely on your behalf.</p>
             </div>
          )}
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
          
          {metaSetupMode === 'self-serve' ? (
            <button
              type="submit"
              form="instagram-form"
              className="bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Connecting...</>
              ) : (
                'Connect Account'
              )}
            </button>
          ) : (
            <button 
              onClick={handleConciergeRequest}
              disabled={loading}
              className="bg-accent-violet hover:bg-accent-violet/90 text-white font-medium px-4 py-2 rounded-md text-sm transition-colors flex items-center justify-center min-w-[100px]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Request Concierge'}
            </button>
          )}
        </div>
      </div>

      <ConnectionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        providerName="Instagram"
      />
    </div>,
    document.body
  );
}
