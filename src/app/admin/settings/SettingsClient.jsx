'use client';

import { useState } from 'react';
import { updatePlatformSettings } from '@/actions/settings';
import { Save, Users, Settings2, CreditCard, Loader2, Sparkles, Database, Layers, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StoragePlans from './StoragePlans';
import AiCreditPlans from './AiCreditPlans';
import WhatsAppAddonPlan from './WhatsAppAddonPlan';
import Toggle from '@/components/ui/Toggle';
import { Smartphone } from 'lucide-react';

export default function SettingsClient({ initialSettings }) {
  const [activeTab, setActiveTab] = useState('main'); // 'main' | 'addons' | 'whatsapp'
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    // Convert string inputs to correct types
    const payload = {
      ...settings,
      maxUsers: parseInt(settings.maxUsers, 10),
      starterPlanPrice: parseInt(settings.starterPlanPrice, 10),
      proPlanPrice: parseInt(settings.proPlanPrice, 10),
    };

    const res = await updatePlatformSettings(payload);
    if (res.success) {
      setSuccess('Platform settings updated successfully.');
      toast.success('Platform settings saved successfully.');
      setSettings(res.settings);
    } else {
      setError(res.error || 'Failed to update settings.');
      toast.error(res.error || 'Failed to update settings.');
    }
    
    setIsSaving(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Master Control</h1>
          <p className="text-sm text-text-secondary">Configure platform limits, base subscriptions, storage quotas, AI credits, and WhatsApp add-ons.</p>
        </div>
        
        {activeTab === 'main' && (
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent-violet hover:bg-accent-violet/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] shrink-0"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border-subtle overflow-x-auto w-full">
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'main'
              ? 'border-accent-violet text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <CreditCard size={14} className={activeTab === 'main' ? 'text-accent-violet' : 'text-text-tertiary'} />
          <span>Main Platform Plans & Registration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addons')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'addons'
              ? 'border-accent-violet text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Layers size={14} className={activeTab === 'addons' ? 'text-accent-violet' : 'text-text-tertiary'} />
          <span>Storage & AI Credits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-2 ${
            activeTab === 'whatsapp'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Smartphone size={14} className={activeTab === 'whatsapp' ? 'text-emerald-400' : 'text-text-tertiary'} />
          <span>WhatsApp Business Add-on</span>
        </button>
      </div>

      {/* Tab 1: Main Platform Plans & Limits */}
      {activeTab === 'main' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Registration & Limits */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Users size={120} />
            </div>
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
              <Settings2 className="text-accent-blue" size={20} />
              <h2 className="text-lg font-semibold text-white">Registration Limits</h2>
            </div>
            
            <div className="space-y-5 relative z-10">
              <Toggle
                checked={settings.starterPlanEnabled}
                onChange={(checked) => handleChange('starterPlanEnabled', checked)}
                label="Enable Public Registration"
                description="Allow users to sign up for the Starter Plan."
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">Maximum User Capacity</label>
                <p className="text-[11px] text-text-tertiary mb-3">Registrations will be blocked once this limit is reached to preserve server resources.</p>
                <input 
                  type="number"
                  value={settings.maxUsers}
                  onChange={(e) => handleChange('maxUsers', e.target.value)}
                  className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                />
              </div>
            </div>
          </div>

          {/* Pricing Master Control */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CreditCard size={120} />
            </div>
            <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
              <CreditCard className="text-accent-violet" size={20} />
              <h2 className="text-lg font-semibold text-white">Plan Configuration</h2>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Starter */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  Starter Plan
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Price (₹)</label>
                    <input 
                      type="number"
                      value={settings.starterPlanPrice}
                      onChange={(e) => handleChange('starterPlanPrice', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Description</label>
                    <input 
                      type="text"
                      value={settings.starterPlanDesc}
                      onChange={(e) => handleChange('starterPlanDesc', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Pro */}
              <div className="p-4 bg-white/5 border border-accent-violet/30 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-transparent pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    Professional Plan
                  </h3>
                  <Toggle
                    checked={settings.proPlanEnabled}
                    onChange={(checked) => handleChange('proPlanEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div>
                    <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Price (₹)</label>
                    <input 
                      type="number"
                      value={settings.proPlanPrice}
                      onChange={(e) => handleChange('proPlanPrice', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Description</label>
                    <textarea 
                      value={settings.proPlanDesc}
                      onChange={(e) => handleChange('proPlanDesc', e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Add-on Plans (Storage Buckets & AI Credits) */}
      {activeTab === 'addons' && (
        <div className="space-y-8 w-full">
          {/* Storage Plans Section */}
          <section className="w-full">
            <StoragePlans />
          </section>

          {/* AI Credit Plans Section */}
          <section className="w-full">
            <AiCreditPlans />
          </section>
        </div>
      )}

      {/* Tab 3: WhatsApp Business Add-on Plan */}
      {activeTab === 'whatsapp' && (
        <section className="w-full">
          <WhatsAppAddonPlan settings={settings} onUpdate={(newSettings) => setSettings(newSettings)} />
        </section>
      )}
    </div>
  );
}
