'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  HardDrive, 
  Zap, 
  Loader2, 
  Sparkles, 
  Crown, 
  Coins, 
  Image as ImageIcon, 
  Film, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  LogIn, 
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PlanUpgradeModal() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pro'); // 'pro' | 'enterprise' | 'storage' | 'ai'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Storage pack selection
  const [selectedStoragePack, setSelectedStoragePack] = useState('Growth Pack (+250 MB)');
  const [selectedAiPack, setSelectedAiPack] = useState('Pro AI Booster (+200 Credits)');

  // Pro Upgrade Payment state
  const [receiptScreenshot, setReceiptScreenshot] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [proNotes, setProNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef(null);

  // Enterprise Custom Inquiry state
  const [entWorkflows, setEntWorkflows] = useState('Custom (100+)');
  const [entExecutions, setEntExecutions] = useState('Custom (25k+)');
  const [entStorage, setEntStorage] = useState('1000');
  const [entAiCredits, setEntAiCredits] = useState('500');
  const [entMessage, setEntMessage] = useState('');

  const upiId = 'billing@automatix.local';

  useEffect(() => {
    if (isOpen) {
      setLoadingSession(true);
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setSession(data);
          } else {
            setSession(null);
          }
        })
        .catch(() => setSession(null))
        .finally(() => setLoadingSession(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      setIsOpen(true);
    };

    const handleQuotaOpen = () => {
      setActiveTab('storage');
      setIsOpen(true);
    };

    window.addEventListener('open-plan-modal', handleOpen);
    window.addEventListener('open-quota-modal', handleQuotaOpen);
    return () => {
      window.removeEventListener('open-plan-modal', handleOpen);
      window.removeEventListener('open-quota-modal', handleQuotaOpen);
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptScreenshot(event.target.result);
      toast.success('Payment receipt attached!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error('Please sign in or create an account first.');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload = {};

      if (activeTab === 'pro') {
        if (!receiptScreenshot) {
          toast.error('Please attach your payment complete screenshot to proceed.');
          setIsSubmitting(false);
          return;
        }
        payload = {
          plan: 'Professional Plan (₹499/mo)',
          receiptScreenshot,
          message: proNotes ? `Notes: ${proNotes}` : 'Professional Plan Upgrade Request'
        };
      } else if (activeTab === 'enterprise') {
        payload = {
          plan: 'Enterprise Custom Plan',
          message: `Workflows: ${entWorkflows} | Executions: ${entExecutions} | Storage: ${entStorage}MB | AI Credits: ${entAiCredits} | Details: ${entMessage || 'N/A'}`
        };
      } else if (activeTab === 'storage') {
        payload = {
          plan: selectedStoragePack,
          message: `Storage Expansion Pack: ${selectedStoragePack}`
        };
      } else if (activeTab === 'ai') {
        payload = {
          plan: selectedAiPack,
          message: `AI Credit Booster Pack: ${selectedAiPack}`
        };
      }

      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      toast.success(
        activeTab === 'pro' 
          ? '🎉 Professional Plan upgrade submitted! Our team will activate your account shortly.'
          : activeTab === 'enterprise'
          ? '🏢 Enterprise inquiry sent! Our concierge team will reach out within 24 hours.'
          : 'Upgrade request submitted successfully!'
      );
      setIsOpen(false);
      setReceiptScreenshot(null);
      setReceiptFileName('');
      setProNotes('');
    } catch (e) {
      toast.error(e.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Strictly dark dimming overlay (NO backdrop blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Solid Dark Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl bg-[#0d0d11] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
                <Crown size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Plan Upgrades & Quota Add-ons
                </h2>
                <p className="text-xs text-text-tertiary">
                  Upgrade your tier, expand storage capacity, or top up AI credits.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-black/40 px-3 sm:px-5 pt-2.5 gap-2 sm:gap-4 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('pro')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'pro'
                  ? 'border-accent-blue text-white'
                  : 'border-transparent text-text-tertiary hover:text-white'
              }`}
            >
              <Zap size={14} className="text-accent-blue" />
              <span>Professional (₹499)</span>
            </button>
            <button
              onClick={() => setActiveTab('enterprise')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'enterprise'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-text-tertiary hover:text-white'
              }`}
            >
              <Crown size={14} className="text-amber-400" />
              <span>Contact for Enterprise</span>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'storage'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-text-tertiary hover:text-white'
              }`}
            >
              <HardDrive size={14} className="text-sky-400" />
              <span>Storage Packs</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'ai'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-text-tertiary hover:text-white'
              }`}
            >
              <Coins size={14} className="text-emerald-400" />
              <span>AI Credits</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* 1. PROFESSIONAL PLAN TAB */}
            {activeTab === 'pro' && (
              <div className="space-y-4">
                {/* Logged in state check */}
                {!session?.user ? (
                  <div className="p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-accent-blue mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Create an Account First</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        You must have an active Automatix account so we can link your Professional license and quota limits.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-accent-blue/20"
                      >
                        <UserPlus size={14} /> Create Free Account
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border border-white/10"
                      >
                        <LogIn size={14} /> Sign In
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* User info prefill pill */}
                    <div className="p-3 bg-zinc-900/90 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] text-text-tertiary uppercase font-semibold">Account Verified</span>
                        <p className="font-bold text-white truncate">{session.user.name || 'Automatix User'}</p>
                        <p className="text-[11px] text-text-secondary truncate font-mono">{session.user.email}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={12} /> Ready to Link
                      </span>
                    </div>

                    {/* Plan features summary */}
                    <div className="p-3.5 bg-white/[0.02] border border-accent-blue/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent-blue" />
                          <span className="text-sm font-bold text-white">Professional Tier Upgrade</span>
                        </div>
                        <span className="text-base font-extrabold text-white font-mono">₹499<span className="text-xs text-text-tertiary font-normal">/mo</span></span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1.5"><Check size={12} className="text-accent-blue" /> 100 Workflows</span>
                        <span className="flex items-center gap-1.5"><Check size={12} className="text-accent-blue" /> 5,000 Executions / mo</span>
                        <span className="flex items-center gap-1.5"><Check size={12} className="text-accent-blue" /> 100 AI Credits / mo</span>
                        <span className="flex items-center gap-1.5"><Check size={12} className="text-accent-blue" /> 200 MB Cloud Storage</span>
                      </div>
                    </div>

                    {/* Payment Transfer Instructions */}
                    <div className="p-3.5 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-sky-400" /> Step 1: Complete UPI Transfer (₹499)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(upiId);
                            setCopiedUpi(true);
                            toast.success('UPI ID copied!');
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono cursor-pointer"
                        >
                          {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg font-mono text-center text-white text-xs select-all">
                        {upiId}
                      </div>
                      <p className="text-[11px] text-text-tertiary leading-relaxed">
                        Transfer <strong>₹499</strong> via GPay, PhonePe, Paytm, or any BHIM UPI app. Take a screenshot of the completed payment.
                      </p>
                    </div>

                    {/* Payment Screenshot Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-white flex items-center justify-between">
                        <span>Step 2: Attach Payment Screenshot</span>
                        <span className="text-[10px] text-sky-400 font-normal">* Required for verification</span>
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />

                      {receiptScreenshot ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={receiptScreenshot} alt="Receipt preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-500/40 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{receiptFileName || 'payment_receipt.jpg'}</p>
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                                <CheckCircle2 size={10} /> Screenshot Attached
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptScreenshot(null);
                              setReceiptFileName('');
                            }}
                            className="text-xs text-text-tertiary hover:text-red-400 transition-colors p-1 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full p-4 border-2 border-dashed border-white/20 hover:border-accent-blue/50 rounded-xl bg-black/40 hover:bg-accent-blue/5 transition-all text-center space-y-1 cursor-pointer group"
                        >
                          <Upload className="w-5 h-5 text-text-tertiary group-hover:text-accent-blue mx-auto transition-colors" />
                          <p className="text-xs font-medium text-white">Click or drag payment screenshot here</p>
                          <p className="text-[10px] text-text-tertiary">PNG, JPG, WEBP up to 5MB</p>
                        </button>
                      )}
                    </div>

                    {/* Additional Notes (Optional) */}
                    <div>
                      <label className="block text-[11px] font-medium text-text-secondary mb-1">
                        Additional Notes / Transaction UTR (Optional)
                      </label>
                      <input
                        type="text"
                        value={proNotes}
                        onChange={(e) => setProNotes(e.target.value)}
                        placeholder="e.g. UTR / Ref No. 423984729384"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue"
                      />
                    </div>

                    <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center gap-2 text-[11px] text-text-tertiary">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>24-Hour Review Guarantee: Once submitted, your tier will activate immediately upon verification.</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. ENTERPRISE TAB */}
            {activeTab === 'enterprise' && (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                    <Crown size={14} /> Custom Agency & Enterprise Capacity
                  </div>
                  Tell us your monthly throughput, storage, and AI processing volume. Our concierge engineers will customize limits for your tenant.
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Workflows Needed</label>
                    <input
                      type="text"
                      value={entWorkflows}
                      onChange={(e) => setEntWorkflows(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Monthly Executions</label>
                    <input
                      type="text"
                      value={entExecutions}
                      onChange={(e) => setEntExecutions(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Storage (MB)</label>
                    <input
                      type="number"
                      value={entStorage}
                      onChange={(e) => setEntStorage(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">AI Credits / Month</label>
                    <input
                      type="number"
                      value={entAiCredits}
                      onChange={(e) => setEntAiCredits(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Organization & Use Case Details
                  </label>
                  <textarea
                    rows={3}
                    value={entMessage}
                    onChange={(e) => setEntMessage(e.target.value)}
                    placeholder="Describe your team size, custom CRM integrations, or dedicated SLA needs..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* 3. STORAGE EXPANSION PACKS TAB (Top Notch Styling per Image 2) */}
            {activeTab === 'storage' && (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Need extra media buffer for your workflow triggers without altering your execution limits? Add a dedicated storage pack anytime.
                </p>

                {[
                  {
                    name: 'Starter Pack (+100 MB)',
                    tag: 'STARTER BOOST',
                    price: '₹199/mo',
                    storage: '+100 MB Cloud Storage',
                    images: '+15 Images',
                    imgLimit: 'Max 2MB each',
                    videos: '+2 Videos',
                    vidLimit: 'Max 25MB each',
                    border: 'border-sky-500/20 hover:border-sky-500/50'
                  },
                  {
                    name: 'Growth Pack (+250 MB)',
                    tag: 'CREATOR CHOICE',
                    price: '₹499/mo',
                    storage: '+250 MB Cloud Storage',
                    images: '+40 Images',
                    imgLimit: 'Max 5MB each',
                    videos: '+5 Videos',
                    vidLimit: 'Max 35MB each',
                    border: 'border-accent-blue/40 bg-accent-blue/5'
                  },
                  {
                    name: 'Power Pack (+500 MB)',
                    tag: 'AGENCY POWER',
                    price: '₹899/mo',
                    storage: '+500 MB Cloud Storage',
                    images: '+80 Images',
                    imgLimit: 'Max 8MB each',
                    videos: '+8 Videos',
                    vidLimit: 'Max 50MB each',
                    border: 'border-white/10 hover:border-white/20'
                  }
                ].map((pack) => {
                  const isSelected = selectedStoragePack === pack.name;
                  return (
                    <div
                      key={pack.name}
                      onClick={() => setSelectedStoragePack(pack.name)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-wider block">{pack.tag}</span>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {pack.name}
                            {isSelected && <CheckCircle2 size={14} className="text-sky-400" />}
                          </h4>
                        </div>
                        <span className="text-sm font-extrabold text-white font-mono">{pack.price}</span>
                      </div>

                      {/* Top notch stylized items */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] pt-1">
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-text-secondary">
                          <HardDrive size={13} className="text-sky-400 shrink-0" />
                          <span className="truncate">{pack.storage}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-text-secondary">
                          <span className="flex items-center gap-1 truncate"><ImageIcon size={13} className="text-emerald-400 shrink-0" /> {pack.images}</span>
                          <span className="text-[9px] font-mono bg-white/10 px-1 rounded text-white/80 shrink-0">{pack.imgLimit}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-text-secondary">
                          <span className="flex items-center gap-1 truncate"><Film size={13} className="text-sky-400 shrink-0" /> {pack.videos}</span>
                          <span className="text-[9px] font-mono bg-white/10 px-1 rounded text-white/80 shrink-0">{pack.vidLimit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. AI CREDITS TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Top up your multimodal AI Radahn tokens for video speech transcription, scene reasoning, and viral synthesis.
                </p>

                {[
                  {
                    name: 'Starter AI Booster (+50 Credits)',
                    tag: 'TOP UP',
                    price: '₹99 (One-Time)',
                    credits: '+50 Multimodal AI Runs',
                    features: 'Verbatim Transcripts & Hooks',
                    border: 'border-emerald-500/20'
                  },
                  {
                    name: 'Pro AI Booster (+200 Credits)',
                    tag: 'MOST POPULAR',
                    price: '₹299 (One-Time)',
                    credits: '+200 Multimodal AI Runs',
                    features: 'Full Multimodal Scene Encoder',
                    border: 'border-accent-blue/30 bg-accent-blue/5'
                  },
                  {
                    name: 'Ultra AI Booster (+500 Credits)',
                    tag: 'POWER AGENTS',
                    price: '₹599 (One-Time)',
                    credits: '+500 Multimodal AI Runs',
                    features: 'Zero Token Bottlenecks',
                    border: 'border-amber-500/20'
                  }
                ].map((pack) => {
                  const isSelected = selectedAiPack === pack.name;
                  return (
                    <div
                      key={pack.name}
                      onClick={() => setSelectedAiPack(pack.name)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block">{pack.tag}</span>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {pack.name}
                            {isSelected && <CheckCircle2 size={14} className="text-emerald-400" />}
                          </h4>
                        </div>
                        <span className="text-sm font-extrabold text-white font-mono">{pack.price}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="flex items-center gap-1 text-emerald-300 font-semibold"><Coins size={13} /> {pack.credits}</span>
                        <span>•</span>
                        <span className="text-text-tertiary truncate">{pack.features}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40 shrink-0">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || (activeTab === 'pro' && !session?.user)}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-accent-blue/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {activeTab === 'pro' ? 'Submit Upgrade Request' : activeTab === 'enterprise' ? 'Send Enterprise Inquiry' : 'Request Add-on Quota'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
