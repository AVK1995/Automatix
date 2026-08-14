'use client';

import { useState, useEffect } from 'react';
import { connectWithApiKey } from '@/actions/connections';
import { X, Loader2, Camera, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';

export default function InstagramModal({ isOpen, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    accessToken: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim() || !formData.username.trim() || !formData.accessToken.trim()) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }

      const result = await connectWithApiKey('Instagram', formData.name, formData.accessToken, formData.username);
      
      if (result && !result.success) {
        setError(result.error || 'Failed to connect Instagram account.');
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
              Enter your Page Access Token to connect your Instagram account.
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

          <form id="instagram-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Connection Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. My Insta Bot"
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Instagram Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="e.g. @mybusiness"
                className="w-full bg-[#111] border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Page Access Token</label>
              <input
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                placeholder="Paste your long-lived token here..."
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
