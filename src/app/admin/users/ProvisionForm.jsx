'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';

export default function ProvisionForm() {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('Professional');
  const [cycle, setCycle] = useState('monthly');
  const [setupLink, setSetupLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProvision = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSetupLink('');

    try {
      const res = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier, cycle })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to provision tenant');
      
      setSetupLink(data.setupLink);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative h-full">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4 relative z-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-blue"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h2 className="text-lg font-semibold text-white">Provision Tenant</h2>
        </div>
      
      <form onSubmit={handleProvision} className="space-y-5 relative z-10">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Client Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Subscription Tier</label>
            <Select 
              value={tier}
              onChange={(val) => setTier(val)}
              options={[
                { value: 'Professional', label: 'Professional (₹499)' },
                { value: 'Enterprise', label: 'Enterprise (Custom)' },
                { value: 'Starter', label: 'Starter (Free)' }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Billing Cycle</label>
            <Select 
              value={cycle}
              onChange={(val) => setCycle(val)}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
              ]}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-medium text-sm py-2.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? 'Provisioning...' : 'Create Account'}
          </button>
        </form>

        {setupLink && (
          <div className="mt-6 bg-accent-blue/10 border border-accent-blue/30 p-4 rounded-lg relative z-10">
            <h3 className="text-sm font-semibold text-accent-blue mb-2">Success! Tenant provisioned.</h3>
            <p className="text-[11px] text-text-secondary mb-3">
              Copy the secure setup link below and email it to the client. They will use this link to set their password.
            </p>
            <div className="bg-black/40 border border-border-subtle p-3 rounded-lg flex items-center justify-between">
              <code className="text-[10px] text-white truncate mr-4 font-mono">{setupLink}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(setupLink)}
                className="text-xs font-semibold text-accent-blue hover:text-white shrink-0 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
