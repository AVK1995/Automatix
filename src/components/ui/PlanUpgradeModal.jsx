'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  UserPlus,
  ArrowRight,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', months: 1, multiplier: 1 },
  { id: 'quarterly', label: 'Quarterly (3 Mo)', months: 3, multiplier: 3 },
  { id: 'yearly', label: 'Yearly (12 Mo)', months: 12, multiplier: 12 },
];

const STORAGE_ADDONS = [
  { id: 'none', name: 'No Storage Add-on', mb: 0, price: 0, desc: 'Continue with plan default storage' },
  { id: 'starter_100', name: 'Starter Pack (+100 MB)', mb: 100, price: 99, desc: '15 Images, 2 Videos (25MB max), 20 Docs' },
  { id: 'growth_250', name: 'Growth Pack (+250 MB)', mb: 250, price: 199, desc: '40 Images, 5 Videos (35MB max), 50 Docs' },
  { id: 'power_500', name: 'Power Pack (+500 MB)', mb: 500, price: 349, desc: '80 Images, 8 Videos (50MB max), 100 Docs' },
];

const AI_ADDONS = [
  { id: 'none', name: 'No AI Top-Up', credits: 0, price: 0, desc: 'Continue with plan standard AI credit quota' },
  { id: 'ai_50', name: 'Starter AI (+50 Credits)', credits: 50, price: 99, desc: 'Ideal for occasional copywriting & template drafts' },
  { id: 'ai_150', name: 'Pro AI (+150 Credits)', credits: 150, price: 249, desc: 'Great for weekly multi-node automation prompts' },
  { id: 'ai_500', name: 'Ultra AI (+500 Credits)', credits: 500, price: 599, desc: 'Heavy production volume & AI Radahn tasks' },
];

export default function PlanUpgradeModal() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Plan & Cycle, 2: Storage, 3: AI Credits, 4: Summary & Payment
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selections
  const [selectedPlan, setSelectedPlan] = useState('pro'); // 'pro' | 'enterprise'
  const [selectedCycle, setSelectedCycle] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [selectedStorage, setSelectedStorage] = useState('none');
  const [selectedAi, setSelectedAi] = useState('none');

  // Payment state
  const [receiptScreenshot, setReceiptScreenshot] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [proNotes, setProNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef(null);

  const upiId = 'billing@automatix.local';

  // Base plan prices
  const baseMonthlyPrice = selectedPlan === 'pro' ? 499 : 1499;
  const cycleObj = BILLING_CYCLES.find(c => c.id === selectedCycle) || BILLING_CYCLES[0];
  const planTotal = baseMonthlyPrice * cycleObj.multiplier;

  const storageObj = STORAGE_ADDONS.find(s => s.id === selectedStorage) || STORAGE_ADDONS[0];
  const aiObj = AI_ADDONS.find(a => a.id === selectedAi) || AI_ADDONS[0];

  const totalPayable = planTotal + storageObj.price + aiObj.price;

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
      if (e.detail?.plan) {
        setSelectedPlan(e.detail.plan);
      }
      if (e.detail?.cycle) {
        setSelectedCycle(e.detail.cycle);
      }
      if (e.detail?.storage) {
        setSelectedStorage(e.detail.storage);
      }
      if (e.detail?.ai) {
        setSelectedAi(e.detail.ai);
      }
      if (e.detail?.step) {
        setCurrentStep(Number(e.detail.step));
      } else {
        setCurrentStep(1);
      }
      setIsOpen(true);
    };

    const handleQuotaOpen = () => {
      setSelectedPlan('pro');
      setCurrentStep(2); // Jump directly to Storage Addon step
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
      toast.error('File size exceeds 5MB limit');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptScreenshot(event.target.result);
      toast.success('Screenshot attached successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error('Please sign in or create an account to proceed');
      return;
    }

    if (!receiptScreenshot) {
      toast.error('Please attach your payment screenshot to verify transfer');
      return;
    }

    setIsSubmitting(true);
    try {
      const planName = selectedPlan === 'pro' ? 'Professional' : 'Enterprise';
      const cycleLabel = cycleObj.label;
      const fullPlanTitle = `${planName} (${cycleLabel})`;

      const detailedMessage = `Selected Plan: ${planName} [${cycleLabel} - ₹${planTotal}] | Storage Addon: ${storageObj.name} (₹${storageObj.price}) | AI Addon: ${aiObj.name} (₹${aiObj.price}) | Total Paid: ₹${totalPayable} | UTR/Notes: ${proNotes || 'None'}`;

      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: fullPlanTitle,
          billingCycle: selectedCycle,
          mainPlan: planName,
          storageAddon: storageObj.name,
          aiAddon: aiObj.name,
          totalAmount: totalPayable,
          receiptScreenshot,
          message: detailedMessage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      toast.success('Upgrade request submitted successfully! Your account will be activated upon verification.');
      setIsOpen(false);
      // Reset state
      setCurrentStep(1);
      setReceiptScreenshot(null);
      setReceiptFileName('');
      setProNotes('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 overflow-y-auto"
        onClick={() => setIsOpen(false)}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-md">
                <Crown size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Plan Upgrades & Add-ons
                </h2>
                <p className="text-xs text-text-tertiary">
                  Step {currentStep} of 4: {
                    currentStep === 1 ? 'Choose Tier & Billing Cycle' :
                    currentStep === 2 ? 'Select Storage Capacity' :
                    currentStep === 3 ? 'Choose AI Credits Booster' :
                    'Review & Submit Payment'
                  }
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

          {/* Step Progress Indicators */}
          <div className="px-5 py-3 border-b border-white/5 bg-black/40 grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider shrink-0">
            {[
              { num: 1, label: '1. Plan' },
              { num: 2, label: '2. Storage' },
              { num: 3, label: '3. AI Booster' },
              { num: 4, label: '4. Checkout' }
            ].map(s => (
              <div 
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                  s.num === currentStep 
                    ? 'bg-accent-blue text-white shadow-sm' 
                    : s.num < currentStep 
                    ? 'bg-white/10 text-white cursor-pointer hover:bg-white/15' 
                    : 'text-text-tertiary bg-white/[0.02]'
                }`}
              >
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Account Status Pill */}
            {session?.user ? (
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">Account Authenticated</span>
                  <p className="text-white font-bold truncate mt-0.5">{session.user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Ready to Upgrade
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-amber-200 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" /> Sign In Required to Finalize
                  </p>
                  <p className="text-amber-200/70 text-[11px]">
                    Create a free account or login to link this upgrade directly to your tenant.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link 
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    <LogIn size={12} /> Sign In
                  </Link>
                  <Link 
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-accent-blue text-white font-semibold text-xs transition-all flex items-center gap-1"
                  >
                    <UserPlus size={12} /> Register
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 1: Main Plan & Billing Cycle Selection */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Plan Selection Cards */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider">
                    Select Plan Tier:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Professional Plan Card */}
                    <div 
                      onClick={() => setSelectedPlan('pro')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        selectedPlan === 'pro'
                          ? 'bg-accent-blue/10 border-accent-blue text-white shadow-md'
                          : 'bg-[#111] border-white/10 hover:border-white/20 text-text-secondary'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Zap size={15} className="text-accent-blue" /> Professional
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-blue/20 text-accent-blue">
                            POPULAR
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary">
                          100 Workflows &bull; 5,000 Executions &bull; 100 AI Credits &bull; 200 MB Storage
                        </p>
                      </div>
                      <div className="text-lg font-extrabold text-white font-mono">
                        ₹499 <span className="text-xs font-normal text-text-tertiary font-sans">/ month</span>
                      </div>
                    </div>

                    {/* Enterprise Plan Card */}
                    <div 
                      onClick={() => setSelectedPlan('enterprise')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        selectedPlan === 'enterprise'
                          ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-md'
                          : 'bg-[#111] border-white/10 hover:border-white/20 text-text-secondary'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Crown size={15} className="text-amber-400" /> Enterprise
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            CUSTOM SCALE
                          </span>
                        </div>
                        <p className="text-xs text-text-tertiary">
                          Custom Workflows &bull; 25k+ Runs &bull; 500 AI Credits &bull; 500 MB Storage
                        </p>
                      </div>
                      <div className="text-lg font-extrabold text-white font-mono">
                        ₹1,499 <span className="text-xs font-normal text-text-tertiary font-sans">/ month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Cycle Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider">
                    Select Billing Duration (Strictly Multiples &bull; No Discounts):
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {BILLING_CYCLES.map(cycle => {
                      const cost = (selectedPlan === 'pro' ? 499 : 1499) * cycle.multiplier;
                      const isSelected = selectedCycle === cycle.id;

                      return (
                        <div
                          key={cycle.id}
                          onClick={() => setSelectedCycle(cycle.id)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-accent-blue/15 border-accent-blue text-white shadow-sm'
                              : 'bg-black/40 border-white/10 hover:border-white/20 text-text-secondary'
                          }`}
                        >
                          <span className="text-xs font-bold block">{cycle.label}</span>
                          <div className="text-sm font-extrabold text-white font-mono">
                            ₹{cost.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[10px] text-text-tertiary block">
                            ₹{baseMonthlyPrice} × {cycle.multiplier}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Storage Add-on Selection */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HardDrive size={16} className="text-accent-blue" />
                    Expand Cloud Storage Buffer (Optional)
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Add dedicated high-capacity storage for your workflow input files, media, and video assets.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {STORAGE_ADDONS.map(addon => {
                    const isSelected = selectedStorage === addon.id;
                    return (
                      <div
                        key={addon.id}
                        onClick={() => setSelectedStorage(addon.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-accent-blue/10 border-accent-blue text-white'
                            : 'bg-[#111] border-white/10 hover:border-white/20 text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-accent-blue bg-accent-blue text-white' : 'border-white/20 bg-black/40'
                          }`}>
                            {isSelected && <Check size={10} />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{addon.name}</span>
                            <span className="text-[11px] text-text-tertiary block">{addon.desc}</span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-white font-mono shrink-0">
                          {addon.price === 0 ? 'Free / Included' : `+₹${addon.price}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: AI Credit Add-on Selection */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Coins size={16} className="text-accent-blue" />
                    Top-Up AI Credits Booster (Optional)
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Empower your workflow nodes with instant generative AI copywriting, vision analysis, and image generation credits.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {AI_ADDONS.map(addon => {
                    const isSelected = selectedAi === addon.id;
                    return (
                      <div
                        key={addon.id}
                        onClick={() => setSelectedAi(addon.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-accent-blue/10 border-accent-blue text-white'
                            : 'bg-[#111] border-white/10 hover:border-white/20 text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-accent-blue bg-accent-blue text-white' : 'border-white/20 bg-black/40'
                          }`}>
                            {isSelected && <Check size={10} />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{addon.name}</span>
                            <span className="text-[11px] text-text-tertiary block">{addon.desc}</span>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-white font-mono shrink-0">
                          {addon.price === 0 ? 'Free / Included' : `+₹${addon.price}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Final Summary & UPI Payment Submission */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Selected Package Summary Cards */}
                <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                      Selected Package Breakdown
                    </span>
                    <span className="text-accent-blue font-semibold cursor-pointer" onClick={() => setCurrentStep(1)}>
                      Edit Selection
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Main Plan */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Zap size={14} className="text-accent-blue shrink-0" />
                        <span>{selectedPlan === 'pro' ? 'Professional Tier' : 'Enterprise Tier'} ({cycleObj.label})</span>
                      </div>
                      <span className="font-mono font-bold text-white">₹{planTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Storage Addon */}
                    {storageObj.price > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <HardDrive size={14} className="text-sky-400 shrink-0" />
                          <span>{storageObj.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">+₹{storageObj.price}</span>
                      </div>
                    )}

                    {/* AI Addon */}
                    {aiObj.price > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Coins size={14} className="text-emerald-400 shrink-0" />
                          <span>{aiObj.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">+₹{aiObj.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Payable Line */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="font-bold text-white">Total Amount to Pay:</span>
                    <span className="font-mono font-extrabold text-accent-blue text-base">
                      ₹{totalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* 2. Step 1: Complete UPI Transfer */}
                <div className="p-3.5 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-sky-400" /> Step 1: Complete UPI Transfer (₹{totalPayable.toLocaleString('en-IN')})
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
                    Transfer exactly <strong>₹{totalPayable.toLocaleString('en-IN')}</strong> via GPay, PhonePe, Paytm, or any BHIM UPI app. Take a screenshot of the completed payment.
                  </p>
                </div>

                {/* 3. Step 2: Attach Payment Screenshot */}
                <div className="p-3.5 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-sky-400" /> Step 2: Attach Payment Screenshot
                    </span>
                    <span className="text-[10px] text-sky-400 font-normal">* Required for verification</span>
                  </div>
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

                {/* 4. Anti-Spam & 24h Warning Banner */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    Anti-Spam Policy: 1 Upgrade Request Per 24 Hours
                  </span>
                  <p className="text-amber-200/80 text-[11px] leading-relaxed">
                    You can only submit 1 upgrade request every 24 hours. Please do not submit fake payments or bluff with screenshots. Repeated false submissions will result in account suspension.
                  </p>
                </div>

                {/* 5. Notes / UTR */}
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary mb-1">
                    Transaction UTR / Reference No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={proNotes}
                    onChange={(e) => setProNotes(e.target.value)}
                    placeholder="e.g. UTR Ref No. 423984729384"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center gap-2 text-[11px] text-text-tertiary">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>24-Hour Review Guarantee: Once verified, your plan and addons will activate immediately.</span>
                </div>
              </div>
            )}

          </div>

          {/* Persistent Dynamic Pricing Cart Bar (Above Footer) */}
          <div className="px-5 py-2.5 bg-black/70 border-t border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-bold">
                Selected: {selectedPlan === 'pro' ? 'Professional' : 'Enterprise'} ({cycleObj.label})
              </span>
              <span className="text-white font-medium truncate block text-[11px]">
                {storageObj.price > 0 ? storageObj.name : 'Base Storage'} &bull; {aiObj.price > 0 ? aiObj.name : 'Base AI'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-bold">Subtotal</span>
              <span className="text-sm font-extrabold text-accent-blue font-mono">
                ₹{totalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Footer Wizard Controls */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40 shrink-0">
            {currentStep > 1 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <div className="flex items-center gap-2">
                {(currentStep === 2 || currentStep === 3) && (
                  <button 
                    onClick={() => {
                      if (currentStep === 2) setSelectedStorage('none');
                      if (currentStep === 3) setSelectedAi('none');
                      setCurrentStep(prev => prev + 1);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-text-tertiary hover:text-white transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                )}
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{currentStep === 1 ? 'Proceed to Storage' : currentStep === 2 ? 'Proceed to AI Top-Up' : 'Proceed to Checkout'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !session?.user}
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Submit Upgrade Request (₹{totalPayable.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
