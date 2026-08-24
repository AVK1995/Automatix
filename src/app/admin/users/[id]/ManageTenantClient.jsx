'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import StorageBucketClient from '@/app/dashboard/storage/StorageBucketClient';
import AdminTicketList from './AdminTicketList';
import { HardDrive, Sparkles, Image, Video, FileText, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_PLANS = [
  {
    name: 'Free Starter (50 MB)',
    tierName: 'Free Plan (50 MB)',
    maxStorageMB: 50,
    maxImages: 10,
    maxImageMB: 2,
    maxVideos: 1,
    maxVideoMB: 25,
    maxDocs: 10,
    maxDocMB: 5,
  },
  {
    name: 'Professional Base (200 MB)',
    tierName: 'Professional Base (200 MB)',
    maxStorageMB: 200,
    maxImages: 30,
    maxImageMB: 5,
    maxVideos: 4,
    maxVideoMB: 35,
    maxDocs: 40,
    maxDocMB: 10,
  },
  {
    name: 'Enterprise Base (500 MB)',
    tierName: 'Enterprise Base (500 MB)',
    maxStorageMB: 500,
    maxImages: 80,
    maxImageMB: 8,
    maxVideos: 8,
    maxVideoMB: 50,
    maxDocs: 100,
    maxDocMB: 20,
  },
  {
    name: 'Starter Pack (+100 MB)',
    tierName: 'Starter Pack (+100 MB)',
    maxStorageMB: 100,
    maxImages: 15,
    maxImageMB: 2,
    maxVideos: 2,
    maxVideoMB: 25,
    maxDocs: 20,
    maxDocMB: 10,
  },
  {
    name: 'Growth Pack (+250 MB)',
    tierName: 'Growth Pack (+250 MB)',
    maxStorageMB: 250,
    maxImages: 40,
    maxImageMB: 5,
    maxVideos: 5,
    maxVideoMB: 35,
    maxDocs: 50,
    maxDocMB: 10,
  },
  {
    name: 'Power Pack (+500 MB)',
    tierName: 'Power Pack (+500 MB)',
    maxStorageMB: 500,
    maxImages: 80,
    maxImageMB: 8,
    maxVideos: 8,
    maxVideoMB: 50,
    maxDocs: 100,
    maxDocMB: 20,
  }
];

export default function ManageTenantClient({ tenant, mediaFiles }) {
  const [activeTab, setActiveTab] = useState('access');

  const [tier, setTier] = useState(tenant.subscriptionTier || 'Professional');
  const [cycle, setCycle] = useState(tenant.subscriptionCycle || 'monthly');
  const [quotaTier, setQuotaTier] = useState(tenant.quotaTier || 'Free Plan (50 MB)');
  const [maxImages, setMaxImages] = useState(tenant.maxImages || 10);
  const [maxImageMB, setMaxImageMB] = useState(tenant.maxImageMB || 2);
  const [maxVideos, setMaxVideos] = useState(tenant.maxVideos || 1);
  const [maxVideoMB, setMaxVideoMB] = useState(tenant.maxVideoMB || 25);
  const [maxDocs, setMaxDocs] = useState(tenant.maxDocs || 10);
  const [maxDocMB, setMaxDocMB] = useState(tenant.maxDocMB || 10);
  const [maxStorageMB, setMaxStorageMB] = useState(tenant.maxStorageMB || 50);
  
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

  const applyPreset = (preset) => {
    setQuotaTier(preset.tierName);
    setMaxStorageMB(preset.maxStorageMB);
    setMaxImages(preset.maxImages);
    setMaxImageMB(preset.maxImageMB);
    setMaxVideos(preset.maxVideos);
    setMaxVideoMB(preset.maxVideoMB);
    setMaxDocs(preset.maxDocs);
    setMaxDocMB(preset.maxDocMB);
    toast.success(`Loaded "${preset.name}" limits`);
  };

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
          tier, 
          cycle, 
          quotaTier,
          maxImages: Number(maxImages), 
          maxImageMB: Number(maxImageMB), 
          maxVideos: Number(maxVideos), 
          maxVideoMB: Number(maxVideoMB), 
          maxDocs: Number(maxDocs),
          maxDocMB: Number(maxDocMB),
          maxStorageMB: Number(maxStorageMB),
          maxSupportTickets: parseInt(maxSupportTickets),
          ticketCooldownHours: parseInt(ticketCooldownHours)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tenant');
      }

      setSuccess('Tenant settings saved successfully');
      toast.success('Tenant settings saved successfully');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess('Password updated successfully');
      setNewPassword('');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
      setConfirmPasswordResetOpen(false);
    }
  };

  const handleGenerateReset = async () => {
    setLinkLoading(true);
    setLinkError('');
    setResetLink('');

    try {
      const res = await fetch(`/api/admin/users/${tenant.id}/reset`, {
        method: 'POST'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate reset link');
      }

      const data = await res.json();
      setResetLink(data.resetLink);
    } catch (err) {
      setLinkError(err.message);
    } finally {
      setLinkLoading(false);
      setConfirmGenerateResetOpen(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Tabs */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('access')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'access'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Access & Security
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'storage'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Storage & Quotas
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'support'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          Support & Tickets
        </button>
      </div>

      {activeTab === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="bg-card border border-border-subtle p-6 rounded-xl">
            <h3 className="text-base font-semibold text-foreground mb-4">Subscription Settings</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
                <input 
                  type="text" 
                  value={tenant.email}
                  disabled
                  className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary opacity-70 cursor-not-allowed"
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

              <div className="pt-2 flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  {success && <span className="text-xs text-green-400 font-medium">{success}</span>}
                  {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
                </div>
              </div>
            </form>
          </section>

          <div className="flex flex-col gap-8">
            <section className="bg-card border border-border-subtle p-6 rounded-xl">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Direct Password Reset</h3>
                <p className="text-xs text-text-secondary mt-1">Force a new password for this tenant.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setConfirmPasswordResetOpen(true); }} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    type="submit" 
                    disabled={resetLoading || !newPassword}
                    className="bg-background border border-border-subtle hover:bg-border-subtle text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'Updating...' : 'Set New Password'}
                  </button>
                  {resetSuccess && <span className="text-xs text-green-400 font-medium">{resetSuccess}</span>}
                  {resetError && <span className="text-xs text-red-400 font-medium">{resetError}</span>}
                </div>
              </form>
            </section>

            <section className="bg-card border border-border-subtle p-6 rounded-xl">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Generate Reset Link</h3>
                <p className="text-xs text-text-secondary mt-1">Generating a new setup link will revoke their current password access.</p>
              </div>
              <button 
                onClick={() => setConfirmGenerateResetOpen(true)}
                disabled={linkLoading}
                className="bg-background border border-border-subtle hover:bg-border-subtle text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {linkLoading ? 'Generating...' : 'Generate New Reset Link'}
              </button>
              {linkError && <p className="text-red-400 text-xs mt-3">{linkError}</p>}
              {resetLink && (
                <div className="mt-4 bg-accent-blue/5 border border-accent-blue/30 p-4 rounded-lg">
                  <h4 className="text-xs font-medium text-accent-blue mb-2">New Link Generated</h4>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-xs text-foreground bg-background px-2 py-1.5 rounded-md border border-border-subtle truncate flex-1 block">{resetLink}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(resetLink)}
                      className="text-xs font-medium text-accent-blue hover:opacity-80 shrink-0 border border-accent-blue/30 px-3 py-1.5 rounded-md"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="bg-card border border-border-subtle p-6 rounded-xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HardDrive size={18} className="text-accent-blue" />
                  Tenant Storage Limits & Quota Control
                </h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                  {quotaTier || 'Free Plan (50 MB)'}
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Configure standard plan allocations or define custom capacity (Total MB, per-file limits, and counts for Images, Videos, and Documents).
              </p>
            </div>

            {/* Quick Presets Loader */}
            <div>
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-2">
                1-Click Quick Preset Loaders:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_PLANS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent-blue/30 text-left transition-all group"
                  >
                    <span className="text-xs font-medium text-white group-hover:text-accent-blue block truncate">
                      {preset.name.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">
                      {preset.maxStorageMB} MB Total
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Quota Form */}
            <form onSubmit={handleUpdate} className="space-y-4 pt-2 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Storage Limit */}
                <div className="sm:col-span-2 bg-accent-blue/5 border border-accent-blue/20 p-3.5 rounded-lg">
                  <label className="block text-xs font-semibold text-accent-blue mb-1">
                    Total Storage Limit (MB) — e.g. 50, 200, 500, 1000
                  </label>
                  <input 
                    type="number" 
                    value={maxStorageMB} 
                    onChange={(e) => setMaxStorageMB(e.target.value)} 
                    className="w-full bg-background border border-accent-blue/30 rounded-lg px-3 py-2 text-sm text-foreground font-bold focus:outline-none focus:border-accent-blue" 
                  />
                </div>

                {/* Images */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Image size={14} className="text-emerald-400" /> Images
                  </span>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">Max Images Allowed</label>
                    <input type="number" value={maxImages} onChange={(e) => setMaxImages(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">Max Size per Image (MB)</label>
                    <input type="number" value={maxImageMB} onChange={(e) => setMaxImageMB(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                  </div>
                </div>

                {/* Videos */}
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video size={14} className="text-accent-blue" /> Videos
                  </span>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">Max Videos Allowed</label>
                    <input type="number" value={maxVideos} onChange={(e) => setMaxVideos(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">Max Size per Video (MB)</label>
                    <input type="number" value={maxVideoMB} onChange={(e) => setMaxVideoMB(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                  </div>
                </div>

                {/* Documents (.pdf, .csv, .xlsx, .docx, .pptx) */}
                <div className="sm:col-span-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-amber-400" /> Documents (.pdf, .csv, .xlsx, .docx, .pptx)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-text-secondary mb-1">Max Docs Allowed</label>
                      <input type="number" value={maxDocs} onChange={(e) => setMaxDocs(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-text-secondary mb-1">Max Size per Doc (MB)</label>
                      <input type="number" value={maxDocMB} onChange={(e) => setMaxDocMB(e.target.value)} className="w-full bg-background border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent-blue" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button type="submit" disabled={loading} className="bg-accent-blue hover:bg-accent-blue/90 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                  {loading ? 'Saving Quota...' : 'Save Storage Limits'}
                </button>
                {success && <span className="text-xs text-emerald-400 font-medium">{success}</span>}
                {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
              </div>
            </form>
          </section>

          <section className="bg-card border border-border-subtle p-6 rounded-xl">
            <h3 className="text-base font-semibold text-foreground mb-4">User Storage Bucket</h3>
            <StorageBucketClient user={{ ...tenant, maxDocs, maxDocMB, maxStorageMB }} mediaFiles={mediaFiles} isAdminView={true} />
          </section>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="bg-card border border-border-subtle p-6 rounded-xl">
            <h3 className="text-base font-semibold text-foreground mb-4">Support Ticket Limits</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Max Tickets</label>
                  <input type="number" value={maxSupportTickets} onChange={(e) => setMaxSupportTickets(e.target.value)} className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Cooldown Duration (Hours)</label>
                  <input type="number" value={ticketCooldownHours} onChange={(e) => setTicketCooldownHours(e.target.value)} className="w-full bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue" />
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-lg mb-4">
                <div>
                  <div className="text-xs font-medium text-white mb-0.5">Current Quota Status</div>
                  <div className="text-[10px] text-text-secondary">{supportTicketsRemaining} of {maxSupportTickets} tickets remaining</div>
                </div>
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/users/${tenant.id}/reset-quota`, { method: 'POST' });
                      if (!res.ok) throw new Error('Failed to reset quota');
                      setSupportTicketsRemaining(maxSupportTickets);
                      toast.success('Quota reset successfully');
                    } catch(e) {
                      toast.error(e.message);
                    }
                  }}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  Reset Quota Now
                </button>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button type="submit" disabled={loading} className="bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Support Quotas'}
                </button>
                {success && <span className="text-xs text-emerald-400 font-medium">{success}</span>}
                {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
              </div>
            </form>
          </section>

          <section className="bg-card border border-border-subtle p-6 rounded-xl">
            <h3 className="text-base font-semibold text-foreground mb-4">User Support Tickets</h3>
            <AdminTicketList tenantId={tenant.id} />
          </section>
        </div>
      )}

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
