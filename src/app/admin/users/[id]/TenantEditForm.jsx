'use client';

import { useState } from 'react';

export default function TenantEditForm({ tenant }) {
  const [tier, setTier] = useState(tenant.subscriptionTier || 'Professional');
  const [cycle, setCycle] = useState(tenant.subscriptionCycle || 'monthly');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [resetError, setResetError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, cycle })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tenant');
      }
      
      setSuccess('Tenant updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReset = async () => {
    if (!confirm('Are you sure? This will immediately revoke their current password access until they use the new link.')) return;
    
    setResetLoading(true);
    setResetError('');
    setResetLink('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}/reset`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reset link');
      
      setResetLink(data.setupLink);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Access Configuration */}
      <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <h3 className="text-base font-medium text-foreground mb-4">Access & Subscription Configuration</h3>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
            <input 
              type="text" 
              value={tenant.email}
              disabled
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-text-secondary opacity-70 cursor-not-allowed"
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
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Starter">Starter</option>
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

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              {success && <span className="text-xs text-green-400 font-medium">{success}</span>}
              {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
            </div>
          </div>
        </form>
      </section>

      {/* Password Management */}
      <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">Password & Access Management</h3>
          <p className="text-xs text-text-secondary mt-1">
            Generating a new setup link will instantly revoke their current password access. You must email them the new link to restore access.
          </p>
        </div>

        <button 
          onClick={handleGenerateReset}
          disabled={resetLoading}
          className="bg-background border border-border-subtle hover:bg-border-subtle text-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {resetLoading ? 'Generating...' : 'Generate New Reset Link'}
        </button>

        {resetError && <p className="text-red-400 text-xs mt-3">{resetError}</p>}

        {resetLink && (
          <div className="mt-4 bg-accent-blue/5 border border-accent-blue/30 p-4 rounded-sm">
            <h4 className="text-xs font-medium text-accent-blue mb-2">New Link Generated</h4>
            <div className="flex items-center justify-between gap-4">
              <code className="text-xs text-foreground bg-background px-2 py-1.5 rounded-sm border border-border-subtle truncate flex-1 block">
                {resetLink}
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText(resetLink)}
                className="text-xs font-medium text-accent-blue hover:opacity-80 shrink-0 border border-accent-blue/30 px-3 py-1.5 rounded-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
