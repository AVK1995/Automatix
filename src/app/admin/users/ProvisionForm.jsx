'use client';

import { useState } from 'react';

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
    <div className="max-w-2xl mb-12">
      <h2 className="text-lg font-medium text-foreground mb-6">Provision New Tenant</h2>
      
      <form onSubmit={handleProvision} className="bg-card border border-border-subtle p-6 rounded-sm space-y-4">
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
            <select 
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
            >
              <option value="Professional">Professional (₹499)</option>
              <option value="Enterprise">Enterprise (Custom)</option>
              <option value="Starter">Starter (Free)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Billing Cycle</label>
            <select 
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="bg-accent-violet hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {loading ? 'Provisioning...' : 'Provision Tenant Account'}
        </button>
      </form>

      {setupLink && (
        <div className="mt-8 bg-accent-blue/10 border border-accent-blue/30 p-6 rounded-sm">
          <h3 className="text-sm font-medium text-accent-blue mb-2">Success! Tenant provisioned.</h3>
          <p className="text-xs text-text-secondary mb-4">
            Copy the secure setup link below and email it to the client. They will use this link to set their password.
          </p>
          <div className="bg-background border border-border-subtle p-3 rounded-sm flex items-center justify-between">
            <code className="text-xs text-foreground truncate mr-4">{setupLink}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(setupLink)}
              className="text-xs font-medium text-accent-blue hover:opacity-80 shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
