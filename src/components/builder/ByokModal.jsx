import React, { useState } from 'react';
import { X, Key, Mail, Lock } from 'lucide-react';
import { addByokConnection } from '@/actions/connections';
import { useRouter } from 'next/navigation';

export default function ByokModal({ isOpen, onClose }) {
  const router = useRouter();
  const [provider, setProvider] = useState('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addByokConnection({ provider, name, email, privateKey });
      router.refresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border-subtle rounded-md shadow-2xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-accent-blue" />
          Bring Your Own Key (BYOK)
        </h2>
        <p className="text-xs text-text-secondary mb-6">
          Connect a dedicated service account to isolate your API usage and quota. Keys are encrypted at rest.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Service Type</label>
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            >
              <option value="google">Google Service Account (Sheets)</option>
              <option value="smtp">SMTP (App Password)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Connection Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={provider === 'google' ? "My Sheets Bot" : "My Email Sender"}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {provider === 'google' ? 'Service Account Email' : 'Email Address'}
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={provider === 'google' ? "worker@project.iam.gserviceaccount.com" : "you@gmail.com"}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center justify-between">
              {provider === 'google' ? 'Private Key' : 'App Password'}
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <Lock className="w-3 h-3" /> Encrypted at rest
              </span>
            </label>
            {provider === 'google' ? (
              <textarea 
                required
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
                rows={4}
                className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
              />
            ) : (
              <input 
                type="password" 
                required
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="16-character app password"
                className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
              />
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
