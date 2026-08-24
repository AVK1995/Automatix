'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function TenantEditForm({ tenant }) {
  const [tier, setTier] = useState(tenant.subscriptionTier || 'Professional');
  const [cycle, setCycle] = useState(tenant.subscriptionCycle || 'monthly');
  const [maxImages, setMaxImages] = useState(tenant.maxImages || 10);
  const [maxImageMB, setMaxImageMB] = useState(tenant.maxImageMB || 1);
  const [maxVideos, setMaxVideos] = useState(tenant.maxVideos || 5);
  const [maxVideoMB, setMaxVideoMB] = useState(tenant.maxVideoMB || 25);
  const [maxStorageMB, setMaxStorageMB] = useState(tenant.maxStorageMB || 1000);
  
  // Support Ticket Settings
  const [maxSupportTickets, setMaxSupportTickets] = useState(tenant.maxSupportTickets || 5);
  const [supportTicketsRemaining, setSupportTicketsRemaining] = useState(tenant.supportTicketsRemaining ?? 5);
  const [ticketCooldownHours, setTicketCooldownHours] = useState(tenant.ticketCooldownHours ?? 24);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const [linkLoading, setLinkLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [linkError, setLinkError] = useState('');

  const [confirmPasswordResetOpen, setConfirmPasswordResetOpen] = useState(false);
  const [confirmGenerateResetOpen, setConfirmGenerateResetOpen] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tier, cycle, maxImages, maxImageMB, maxVideos, maxVideoMB, maxStorageMB,
          maxSupportTickets: parseInt(maxSupportTickets),
          ticketCooldownHours: parseInt(ticketCooldownHours)
        })
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

  const handleDirectPasswordReset = async () => {
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      setResetSuccess('Password forcibly updated. The user can now log in with this new password.');
      setNewPassword('');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleGenerateReset = async () => {
    setLinkLoading(true);
    setLinkError('');
    setResetLink('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}/reset`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reset link');
      
      setResetLink(data.setupLink);
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* LEFT COLUMN: Access Configuration */}
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
              <Select 
                value={tier}
                onChange={(val) => setTier(val)}
                options={[
                  { value: 'Professional', label: 'Professional' },
                  { value: 'Enterprise', label: 'Enterprise' },
                  { value: 'Starter', label: 'Starter' }
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

          <div className="pt-4 border-t border-border-subtle mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Storage Tier Status</h4>
            <div className="bg-white/[0.02] border border-white/10 rounded-md p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Assigned Storage Plan:</span>
                <span className="font-medium text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20">
                  {tenant.quotaTier || 'Free Plan (50 MB)'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/5 text-text-tertiary">
                <span>Total Storage Capacity:</span>
                <span className="text-foreground font-medium">{tenant.maxStorageMB || 50} MB</span>
              </div>
              <div className="flex justify-between items-center text-text-tertiary">
                <span>Media Limits:</span>
                <span className="text-foreground">
                  {tenant.maxImages || 10} Images (max {tenant.maxImageMB || 2}MB) • {tenant.maxVideos || 1} Videos (max {tenant.maxVideoMB || 25}MB)
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary pt-1 border-t border-white/5 italic">
                Storage tiers are managed via frozen plans & approved client queries in the Admin Requests page.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Support Ticket Limits</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Tickets</label>
                <input 
                  type="number" 
                  value={maxSupportTickets}
                  onChange={(e) => setMaxSupportTickets(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Cooldown Duration (Hours)</label>
                <input 
                  type="number" 
                  value={ticketCooldownHours}
                  onChange={(e) => setTicketCooldownHours(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-md">
              <div>
                <div className="text-xs font-medium text-white mb-0.5">Current Quota Status</div>
                <div className="text-[10px] text-text-secondary">
                  {supportTicketsRemaining} of {maxSupportTickets} tickets remaining
                </div>
              </div>
              <button 
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/users/${tenant.id}/reset-quota`, { method: 'POST' });
                    if (!res.ok) throw new Error('Failed to reset quota');
                    setSupportTicketsRemaining(maxSupportTickets);
                    toast?.success?.('Quota reset successfully') || alert('Quota reset successfully');
                  } catch(e) {
                    toast?.error?.(e.message) || alert(e.message);
                  }
                }}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
              >
                Reset Quota Now
              </button>
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

      {/* RIGHT COLUMN: Password & Security Actions */}
      <div className="flex flex-col gap-8">
        {/* Direct Password Reset */}
        <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">Direct Password Reset</h3>
          <p className="text-xs text-text-secondary mt-1">
            Force a new password for this tenant. This will immediately revoke their current access.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setConfirmPasswordResetOpen(true); }} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              type="submit"
              disabled={resetLoading || !newPassword}
              className="bg-background border border-border-subtle hover:bg-border-subtle text-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"
            >
              {resetLoading ? 'Updating...' : 'Set New Password'}
            </button>
            {resetSuccess && <span className="text-xs text-green-400 font-medium">{resetSuccess}</span>}
            {resetError && <span className="text-xs text-red-400 font-medium">{resetError}</span>}
          </div>
        </form>
      </section>

      {/* Generate Reset Link */}
      <section className="bg-card border border-border-subtle p-6 rounded-sm">
        <div className="mb-4">
          <h3 className="text-base font-medium text-foreground">Generate Reset Link</h3>
          <p className="text-xs text-text-secondary mt-1">
            Generating a new setup link will instantly revoke their current password access. You must email them the new link to restore access.
          </p>
        </div>

        <button 
          onClick={() => setConfirmGenerateResetOpen(true)}
          disabled={linkLoading}
          className="bg-background border border-border-subtle hover:bg-border-subtle text-foreground px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {linkLoading ? 'Generating...' : 'Generate New Reset Link'}
        </button>

        {linkError && <p className="text-red-400 text-xs mt-3">{linkError}</p>}

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

      <ConfirmModal
        isOpen={confirmPasswordResetOpen}
        onClose={() => setConfirmPasswordResetOpen(false)}
        onConfirm={handleDirectPasswordReset}
        title="Force Password Reset"
        message="Are you sure you want to forcibly change this user's password? This will immediately revoke their current access."
        confirmText="Reset Password"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={confirmGenerateResetOpen}
        onClose={() => setConfirmGenerateResetOpen(false)}
        onConfirm={handleGenerateReset}
        title="Generate Reset Link"
        message="Are you sure? This will immediately revoke their current password access until they use the new link."
        confirmText="Generate Link"
        isDestructive={true}
      />
    </div>
  );
}
