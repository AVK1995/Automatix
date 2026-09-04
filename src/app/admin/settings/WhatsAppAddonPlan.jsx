'use client';

import { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, Zap, DollarSign, Save, Loader2, Info, ExternalLink, HelpCircle } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';
import toast from 'react-hot-toast';
import { updatePlatformSettings } from '@/actions/settings';

export default function WhatsAppAddonPlan({ settings: initialSettings, onUpdate }) {
  const [settings, setSettings] = useState(initialSettings || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        whatsappAddonEnabled: Boolean(settings.whatsappAddonEnabled),
        whatsappAddonPriceRs: parseInt(settings.whatsappAddonPriceRs || 799, 10),
        whatsappAddonYearlyPriceRs: parseInt(settings.whatsappAddonYearlyPriceRs || 7999, 10),
        whatsappAddonDesc: settings.whatsappAddonDesc || 'Automate WhatsApp templates, broadcasts, and public cURL API triggers.'
      };

      const res = await updatePlatformSettings(payload);
      if (res.success) {
        toast.success('WhatsApp Add-on pricing updated successfully!');
        if (onUpdate) onUpdate(res.settings);
      } else {
        toast.error(res.error || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Informational Callout: Zero Financial Liability */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3 text-emerald-300">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white flex items-center gap-2">
            Model B: Zero Financial Liability Architecture Active
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono uppercase tracking-wider">
              Protected
            </span>
          </p>
          <p className="text-emerald-200/80 leading-relaxed">
            Tenants attach their credit card directly inside their own Meta WhatsApp Business Manager during or after connecting. Meta bills conversation fees directly to the client at wholesale rates. Automatix charges this flat platform add-on fee with <strong>zero risk of unpaid conversation debt or message chargebacks</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left 2 Cols: Form Configuration */}
        <div className="lg:col-span-2 bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">WhatsApp Business Automation Plan</h2>
                <p className="text-xs text-text-secondary">Set global pricing and access permissions for WhatsApp template engine</p>
              </div>
            </div>
            <Toggle
              checked={settings.whatsappAddonEnabled || false}
              onChange={(checked) => handleChange('whatsappAddonEnabled', checked)}
              label="Enable Add-on Requirement"
            />
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Monthly Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={settings.whatsappAddonPriceRs ?? 799}
                    onChange={(e) => handleChange('whatsappAddonPriceRs', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="799"
                  />
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">Suggested: ₹499 - ₹999 / month</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Annual Discounted Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={settings.whatsappAddonYearlyPriceRs ?? 7999}
                    onChange={(e) => handleChange('whatsappAddonYearlyPriceRs', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="7999"
                  />
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">Suggested: ₹6999 - ₹9999 / year</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Plan Description
              </label>
              <textarea
                rows={2}
                value={settings.whatsappAddonDesc || ''}
                onChange={(e) => handleChange('whatsappAddonDesc', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Automate WhatsApp templates, broadcasts, and public cURL API triggers."
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{isSaving ? 'Saving...' : 'Save WhatsApp Plan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Plan Preview Card */}
        <div className="bg-gradient-to-b from-[#161616] to-[#0d0d0d] border border-emerald-500/20 rounded-xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Smartphone size={160} />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Client Preview
              </span>
              <span className="text-xs text-text-tertiary">Billed Annually or Monthly</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">WhatsApp Business Add-on</h3>
              <p className="text-xs text-text-secondary mt-1">{settings.whatsappAddonDesc || 'Automate WhatsApp templates, broadcasts, and public cURL API triggers.'}</p>
            </div>

            <div className="pt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">₹{settings.whatsappAddonPriceRs || 799}</span>
                <span className="text-xs text-text-secondary">/ month</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                or ₹{settings.whatsappAddonYearlyPriceRs || 7999} / year (Save 17%)
              </p>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Native WhatsApp Template Studio</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Live Smartphone Chat Preview</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Account-Level Public cURL API Gateway</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Workflow Canvas Action Node</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Direct Meta Wholesale Billing</span>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <div className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold text-center">
              {settings.whatsappAddonEnabled ? 'Add-on Required for Tenants' : 'Free / Open to All Tenants'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
