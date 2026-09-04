'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Smartphone, HelpCircle, CheckCircle2, ShieldCheck, ExternalLink, Copy, Check, Info, Sparkles, BookOpen, Key } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function WhatsappModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'guide' | 'billing'
  const [copiedKey, setCopiedKey] = useState(null);

  const [formData, setFormData] = useState({
    connectionName: '',
    phoneNumberId: '',
    wabaId: '',
    pageAccessToken: ''
  });
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (initialData) {
      setFormData({
        connectionName: initialData.name || '',
        phoneNumberId: initialData.privateKey || initialData.accountEmail || '',
        wabaId: initialData.clientEmail || '',
        pageAccessToken: initialData.apiKey || ''
      });
    }
  }, [initialData]);

  if (!isOpen || !mounted) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.connectionName.trim() || !formData.phoneNumberId.trim() || !formData.pageAccessToken.trim()) {
        setError('Please fill in Connection Name, Phone Number ID, and Permanent Access Token.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/integrations/meta/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: 'whatsapp',
          connectionName: formData.connectionName.trim(),
          phoneNumberId: formData.phoneNumberId.trim(),
          wabaId: formData.wabaId.trim(),
          pageAccessToken: formData.pageAccessToken.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to verify and connect WhatsApp account.');
        setLoading(false);
        return;
      }

      toast.success(`WhatsApp account connected! (${data.phone})`);
      setLoading(false);
      onSuccess(data.integrationId);
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while connecting to Meta.');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-[#0f0f0f] border border-border-subtle rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Connect WhatsApp Business
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Cloud API
                </span>
              </h2>
              <p className="text-xs text-text-secondary">Official Meta Cloud API • Zero markup on conversation costs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle bg-[#111] px-5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'connect'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <Key size={14} className={activeTab === 'connect' ? 'text-emerald-400' : 'text-text-tertiary'} />
            <span>Direct Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <BookOpen size={14} className={activeTab === 'guide' ? 'text-emerald-400' : 'text-text-tertiary'} />
            <span>3-Minute Setup Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'billing'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'billing' ? 'text-emerald-400' : 'text-text-tertiary'} />
            <span>Direct Meta Billing Notice</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <span className="font-bold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CONNECT FORM */}
          {activeTab === 'connect' && (
            <form id="whatsapp-connect-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                  Connection Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.connectionName}
                  onChange={(e) => setFormData({ ...formData, connectionName: e.target.value })}
                  placeholder="e.g. Sales Support Bot or Primary WhatsApp"
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-text-tertiary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider">
                      Phone Number ID <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-text-tertiary">From Meta Cloud API</span>
                  </div>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    placeholder="e.g. 104829381920394"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors placeholder:text-text-tertiary/50"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-white uppercase tracking-wider">
                      WABA ID (Account ID)
                    </label>
                    <span className="text-[10px] text-text-tertiary">For template syncing</span>
                  </div>
                  <input
                    type="text"
                    value={formData.wabaId}
                    onChange={(e) => setFormData({ ...formData, wabaId: e.target.value })}
                    placeholder="e.g. 984728192837461"
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors placeholder:text-text-tertiary/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-white uppercase tracking-wider">
                    Permanent Access Token <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <HelpCircle size={12} /> How to get token?
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formData.pageAccessToken}
                  onChange={(e) => setFormData({ ...formData, pageAccessToken: e.target.value })}
                  placeholder="EAAG..."
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono resize-none transition-colors placeholder:text-text-tertiary/50"
                  required
                />
                <p className="text-[11px] text-text-tertiary mt-1">
                  System User Token with <code className="text-emerald-400 font-mono">whatsapp_business_messaging</code> and <code className="text-emerald-400 font-mono">whatsapp_business_management</code> permissions.
                </p>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Zero Markup Guarantee: Meta bills conversation costs directly to your payment card.</span>
              </div>
            </form>
          )}

          {/* TAB 2: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Meta Cloud API Direct Setup (Takes ~3 minutes)
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Follow these steps to connect your WhatsApp Business number directly with zero middleman fees.
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                  Create or Open a Meta Business App
                </div>
                <p className="text-text-secondary leading-relaxed pl-7">
                  Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Meta for Developers <ExternalLink size={10} /></a>, click <strong>Create App</strong>, choose <strong>Other</strong>, and select the <strong>Business</strong> app type.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
                  Add WhatsApp Product & Copy IDs
                </div>
                <p className="text-text-secondary leading-relaxed pl-7">
                  Under your App Dashboard, click <strong>Set Up</strong> next to WhatsApp. In the left sidebar, navigate to <strong>WhatsApp &gt; API Setup</strong>. You will find your <strong>Phone Number ID</strong> and <strong>WhatsApp Business Account ID</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
                  Create Permanent System User Token
                </div>
                <p className="text-text-secondary leading-relaxed pl-7">
                  Open <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Meta Business Settings &gt; System Users <ExternalLink size={10} /></a>. Create an Admin System User, click <strong>Generate Token</strong>, select your App, and check these 2 permissions:
                </p>
                <div className="pl-7 flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-300">
                    whatsapp_business_messaging
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-300">
                    whatsapp_business_management
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">4</span>
                  Paste Credentials in Automatix & Done!
                </div>
                <p className="text-text-secondary leading-relaxed pl-7">
                  Copy the generated token and IDs into the Direct Setup tab and hit <strong>Verify & Connect</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ZERO LIABILITY / BILLING NOTICE */}
          {activeTab === 'billing' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-emerald-200">
                <p className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Direct Meta Billing Architecture (Model B)
                </p>
                <p className="text-xs text-emerald-300/90">
                  Automatix is built with a direct-to-Meta passthrough engine so you always pay the true wholesale conversation rate with zero hidden surcharges.
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-[#141414] border border-white/10">
                <h4 className="font-bold text-white text-xs">How Meta Charges for WhatsApp:</h4>
                <ul className="space-y-2 text-text-secondary list-disc pl-5">
                  <li><strong>Service Conversations:</strong> Free (when customer messages you first, you get a 24-hour free reply window).</li>
                  <li><strong>Utility Conversations:</strong> Low rate (~$0.005 to $0.01 / conversation) for order confirmations, booking reminders, and OTPs.</li>
                  <li><strong>Marketing Conversations:</strong> Standard rate (~$0.01 to $0.03 / conversation) for promotions and sales announcements.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2">
                <h4 className="font-bold text-white text-xs">Where do you pay?</h4>
                <p className="text-text-secondary">
                  You attach your payment card directly under <a href="https://business.facebook.com/billing_hub" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Meta Business Manager &gt; Payment Methods <ExternalLink size={10} /></a>. Meta bills your card directly on their standard invoicing threshold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-[#141414]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'connect' ? (
            <button
              type="submit"
              form="whatsapp-connect-form"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>{loading ? 'Verifying with Meta...' : 'Verify & Connect WhatsApp'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('connect')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <span>Go to Direct Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
