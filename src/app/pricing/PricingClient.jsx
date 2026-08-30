'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon } from '@/components/Icons';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  HardDrive, 
  Coins, 
  AlertTriangle,
  QrCode,
  Copy,
  Upload,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', multiplier: 1 },
  { id: 'quarterly', label: 'Quarterly (3 Months)', multiplier: 3 },
  { id: 'yearly', label: 'Yearly (12 Months)', multiplier: 12 },
];

const STORAGE_OPTIONS = [
  { id: 'none', name: 'No Storage Add-on', desc: 'Default plan storage capacity', price: 0, mb: 0 },
  { id: 'starter_100', name: 'Starter Pack (+100 MB)', desc: '15 Images, 2 Videos (25MB max), 20 Docs', price: 99, mb: 100 },
  { id: 'growth_250', name: 'Growth Pack (+250 MB)', desc: '40 Images, 5 Videos (35MB max), 50 Docs', price: 199, mb: 250 },
  { id: 'power_500', name: 'Power Pack (+500 MB)', desc: '80 Images, 8 Videos (50MB max), 100 Docs', price: 349, mb: 500 },
];

const AI_OPTIONS = [
  { id: 'none', name: 'No AI Top-Up', desc: 'Standard plan AI credits', price: 0, credits: 0 },
  { id: 'ai_50', name: 'Starter AI (+50 Credits)', desc: 'Ideal for prompt copywriting and occasional AI drafts', price: 99, credits: 50 },
  { id: 'ai_150', name: 'Pro AI (+150 Credits)', desc: 'Great for multi-node automation and vision analysis', price: 249, credits: 150 },
  { id: 'ai_500', name: 'Ultra AI (+500 Credits)', desc: 'High volume production & heavy AI Radahn workflows', price: 599, credits: 500 },
];

export default function PricingClient({ session, settings }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Step: 1 = Main Plan, 2 = Storage, 3 = AI Booster, 4 = Final Checkout
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedPlan, setSelectedPlan] = useState('pro'); // 'starter' | 'pro' | 'enterprise'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [selectedStorage, setSelectedStorage] = useState('none');
  const [selectedAi, setSelectedAi] = useState('none');

  // Checkout form state
  const [receiptScreenshot, setReceiptScreenshot] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [proNotes, setProNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const upiId = 'billing@automatix.local';
  const user = session?.user;

  // Active Plan & Expiry Analysis for user
  const userTier = (user?.subscriptionTier || 'starter').toLowerCase();
  const userCycle = (user?.subscriptionCycle || 'monthly').toLowerCase();
  const userExpiry = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const daysUntilExpiry = userExpiry ? (userExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 999;
  const isWithinFinal5Days = daysUntilExpiry <= 5 && daysUntilExpiry >= 0;

  // Price calculations
  const cycleObj = BILLING_CYCLES.find(c => c.id === billingCycle) || BILLING_CYCLES[0];
  const proMonthly = settings?.proPlanPrice || 499;
  const entMonthly = 1499;

  const planBasePrice = selectedPlan === 'pro' ? proMonthly : selectedPlan === 'enterprise' ? entMonthly : 0;
  const planTotal = planBasePrice * cycleObj.multiplier;

  const storageObj = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || STORAGE_OPTIONS[0];
  const aiObj = AI_OPTIONS.find(a => a.id === selectedAi) || AI_OPTIONS[0];

  const totalPayable = planTotal + storageObj.price + aiObj.price;

  // Restore saved configuration if redirected back after login/register
  useEffect(() => {
    try {
      const saved = localStorage.getItem('automatix_pending_plan_selection');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.plan) setSelectedPlan(parsed.plan);
        if (parsed.cycle) setBillingCycle(parsed.cycle);
        if (parsed.storage) setSelectedStorage(parsed.storage);
        if (parsed.ai) setSelectedAi(parsed.ai);
        if (parsed.step) setCurrentStep(Number(parsed.step));
        localStorage.removeItem('automatix_pending_plan_selection');
        toast.success('Your plan selection has been restored!');
      }
    } catch {}
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
      toast.success('Payment screenshot attached successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleStepProceed = (nextStep) => {
    // Check Downgrade/Same-Plan restrictions if logged in
    if (user && nextStep > 1) {
      const isTargetingSame = (selectedPlan === 'pro' && userTier.includes('pro') && billingCycle === userCycle) ||
                             (selectedPlan === 'enterprise' && userTier.includes('ent') && billingCycle === userCycle);
      
      const isDowngrade = (userTier.includes('ent') && selectedPlan === 'pro') ||
                          (userTier.includes('pro') && selectedPlan === 'starter') ||
                          (userCycle === 'yearly' && billingCycle !== 'yearly') ||
                          (userCycle === 'quarterly' && billingCycle === 'monthly');

      if (isTargetingSame && !isWithinFinal5Days) {
        toast.error(`You currently have an active ${user.subscriptionTier} (${user.subscriptionCycle}) plan. You can renew during your final 5 days of validity.`);
        return;
      }

      if (isDowngrade && !isWithinFinal5Days) {
        toast.error(`Plan downgrades can only be requested during the final 5 days before your current plan expires.`);
        return;
      }
    }

    setCurrentStep(nextStep);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleSubmitUpgrade = async () => {
    if (!user) {
      // Save state and redirect to register
      localStorage.setItem('automatix_pending_plan_selection', JSON.stringify({
        plan: selectedPlan,
        cycle: billingCycle,
        storage: selectedStorage,
        ai: selectedAi,
        step: 4
      }));
      router.push(`/register?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (!receiptScreenshot) {
      toast.error('Please attach your payment screenshot to verify transfer');
      return;
    }

    setIsSubmitting(true);
    try {
      const planName = selectedPlan === 'pro' ? 'Professional' : selectedPlan === 'enterprise' ? 'Enterprise' : 'Starter';
      const cycleLabel = cycleObj.label;
      const fullPlanTitle = `${planName} (${cycleLabel})`;

      const detailedMessage = `Selected Plan: ${planName} [${cycleLabel} - ₹${planTotal}] | Storage Addon: ${storageObj.name} (₹${storageObj.price}) | AI Addon: ${aiObj.name} (₹${aiObj.price}) | Total Paid: ₹${totalPayable} | UTR/Notes: ${proNotes || 'None'}`;

      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: fullPlanTitle,
          billingCycle,
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
        throw new Error(data.error || 'Failed to submit upgrade request');
      }

      toast.success('Upgrade request submitted successfully! Your account will be activated upon admin verification.');
      router.push('/dashboard/billing');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center relative overflow-hidden py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 pb-32">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header & Step Wizard Progress Bar */}
      <div className="relative z-10 w-full max-w-4xl text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
          <span>Step-by-Step Plan Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 text-white tracking-tight">
          {currentStep === 1 && 'Step 1: Choose Your Main Plan'}
          {currentStep === 2 && 'Step 2: Select Storage Buffer (Optional)'}
          {currentStep === 3 && 'Step 3: Top Up AI Credits Booster (Optional)'}
          {currentStep === 4 && 'Step 4: Review Package & Submit Payment'}
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {currentStep === 1 && 'Select your automation capacity and billing duration. Strictly exact multiples, no hidden charges.'}
          {currentStep === 2 && 'Expand high-speed cloud storage for your workflow input files, media, and document assets.'}
          {currentStep === 3 && 'Supercharge your workflow nodes with generative copywriting and vision analysis credits.'}
          {currentStep === 4 && 'Complete UPI transfer and attach screenshot for immediate verification and access grant.'}
        </p>

        {/* 4-Step Progress Ribbon */}
        <div className="mt-6 max-w-xl mx-auto grid grid-cols-4 gap-2 bg-[#111] p-1.5 rounded-xl border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          {[
            { num: 1, label: '1. Plan' },
            { num: 2, label: '2. Storage' },
            { num: 3, label: '3. AI Booster' },
            { num: 4, label: '4. Checkout' }
          ].map(s => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                s.num === currentStep
                  ? 'bg-accent-blue text-white shadow-sm'
                  : s.num < currentStep
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'text-text-tertiary bg-white/[0.02]'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Container Area */}
      <div className="relative z-10 w-full max-w-5xl mx-auto space-y-8">
        
        {/* STEP 1: Main Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Billing Cycle Selector */}
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                Select Billing Duration (Multiples &bull; No Discounts):
              </span>
              <div className="inline-flex p-1 bg-[#111] border border-white/10 rounded-xl">
                {BILLING_CYCLES.map(cycle => (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setBillingCycle(cycle.id)}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      billingCycle === cycle.id
                        ? 'bg-accent-blue text-white shadow-sm'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Main Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* 1. Starter Free Tier */}
              <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white">Starter</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                      FREE TIER
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mb-4 min-h-[30px]">
                    Perfect for testing and small personal automation tasks.
                  </p>
                  <div className="text-3xl lg:text-4xl font-extrabold mb-5 text-white">
                    ₹0<span className="text-xs text-text-secondary font-medium font-sans"> / forever</span>
                  </div>
                  
                  <div className="space-y-3 mb-6 border-t border-white/5 pt-5 text-xs text-text-secondary">
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> Up to 3 Workflows</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 100 Executions / month</div>
                    <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-emerald-400 mr-2.5 shrink-0" /> 10 AI Credits / month</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 50 MB Cloud Storage</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 10 Images & 1 Video (25MB max)</div>
                  </div>
                </div>

                <div>
                  <Link 
                    href="/register" 
                    className="block text-center w-full py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Get Started for Free
                  </Link>
                </div>
              </div>

              {/* 2. Professional Tier (Featured) */}
              <div 
                onClick={() => setSelectedPlan('pro')}
                className={`bg-gradient-to-b from-[#18122B] via-[#100c1e] to-[#0d0d12] border-2 rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative shadow-xl transition-all cursor-pointer ${
                  selectedPlan === 'pro' 
                    ? 'border-accent-blue ring-2 ring-accent-blue/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]' 
                    : 'border-purple-500/40 hover:border-purple-500/70'
                }`}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent-blue text-white text-[9px] font-extrabold tracking-widest px-3 py-0.5 rounded-full shadow uppercase flex items-center gap-1">
                  <Zap size={10} /> POPULAR CHOICE
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Professional</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                      PRO LICENSE
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mb-4 min-h-[30px]">
                    For businesses and creators automating workflows at scale.
                  </p>
                  <div className="text-3xl lg:text-4xl font-extrabold mb-5 text-white font-mono">
                    ₹{(proMonthly * cycleObj.multiplier).toLocaleString('en-IN')}<span className="text-xs text-text-tertiary font-medium font-sans"> / {cycleObj.label}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6 border-t border-white/10 pt-5 text-xs text-white">
                    <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 100 Workflows</div>
                    <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 5,000 Executions / month</div>
                    <div className="flex items-center font-semibold text-accent-blue"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 100 AI Credits / month</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 200 MB Storage Allowance</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 30 Images & 4 Videos (25MB max)</div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan('pro');
                      handleStepProceed(2);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlan === 'pro'
                        ? 'bg-accent-blue text-white shadow-md shadow-accent-blue/30'
                        : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                    <span>{selectedPlan === 'pro' ? 'Selected &bull; Continue to Storage &rarr;' : 'Select Professional'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Enterprise Tier */}
              <div 
                onClick={() => setSelectedPlan('enterprise')}
                className={`bg-[#0f0f13] border rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition-all cursor-pointer ${
                  selectedPlan === 'enterprise' 
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/[0.03]' 
                    : 'border-white/10 hover:border-amber-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                      <span>Enterprise</span>
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      CUSTOM SCALE
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mb-4 min-h-[30px]">
                    For agency operations, custom multi-trigger webhooks, and scale.
                  </p>
                  <div className="text-3xl lg:text-4xl font-extrabold mb-5 text-white font-mono">
                    ₹{(entMonthly * cycleObj.multiplier).toLocaleString('en-IN')}<span className="text-xs text-text-tertiary font-medium font-sans"> / {cycleObj.label}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6 border-t border-white/5 pt-5 text-xs text-text-secondary">
                    <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> Custom Workflows</div>
                    <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> 25k+ Workflow Executions</div>
                    <div className="flex items-center text-amber-200"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> 500 AI Credits / month</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 500 MB Base Cloud Storage</div>
                    <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 80 Images & 8 High-Res Videos</div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan('enterprise');
                      handleStepProceed(2);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedPlan === 'enterprise'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'border border-white/20 bg-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <Crown size={13} className={selectedPlan === 'enterprise' ? 'text-black' : 'text-amber-400'} />
                    <span>{selectedPlan === 'enterprise' ? 'Selected &bull; Continue to Storage &rarr;' : 'Select Enterprise'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Storage Addon Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-2xl mx-auto bg-[#0f0f13] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive size={18} className="text-accent-blue" />
                <span>Step 2: Expand Cloud Storage Buffer (Optional)</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Selected Base Plan: <strong className="text-white uppercase">{selectedPlan}</strong> ({cycleObj.label} &bull; ₹{planTotal.toLocaleString('en-IN')})
              </p>
            </div>

            <div className="space-y-3">
              {STORAGE_OPTIONS.map(addon => {
                const isSelected = selectedStorage === addon.id;
                return (
                  <div
                    key={addon.id}
                    onClick={() => setSelectedStorage(addon.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-accent-blue/10 border-accent-blue text-white shadow-md'
                        : 'bg-[#141419] border-white/10 hover:border-white/20 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-accent-blue bg-accent-blue text-white' : 'border-white/20 bg-black/40'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block">{addon.name}</span>
                        <span className="text-[11px] text-text-tertiary block mt-0.5">{addon.desc}</span>
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-white font-mono shrink-0">
                      {addon.price === 0 ? 'Free / None' : `+₹${addon.price}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: AI Credit Addon Selection */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto bg-[#0f0f13] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={18} className="text-accent-blue" />
                <span>Step 3: Top-Up AI Credits Booster (Optional)</span>
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Selected Base Plan: <strong className="text-white uppercase">{selectedPlan}</strong> ({cycleObj.label}) + Storage: <strong className="text-white">{storageObj.name}</strong>
              </p>
            </div>

            <div className="space-y-3">
              {AI_OPTIONS.map(addon => {
                const isSelected = selectedAi === addon.id;
                return (
                  <div
                    key={addon.id}
                    onClick={() => setSelectedAi(addon.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-accent-blue/10 border-accent-blue text-white shadow-md'
                        : 'bg-[#141419] border-white/10 hover:border-white/20 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-accent-blue bg-accent-blue text-white' : 'border-white/20 bg-black/40'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block">{addon.name}</span>
                        <span className="text-[11px] text-text-tertiary block mt-0.5">{addon.desc}</span>
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-white font-mono shrink-0">
                      {addon.price === 0 ? 'Free / None' : `+₹${addon.price}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Final Checkout & Submission */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-2xl mx-auto bg-[#0f0f13] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            
            {/* Anti-Spam & 24h Cooldown Warning Banner */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                Anti-Spam Policy: 1 Upgrade Request Per 24 Hours
              </span>
              <p className="text-amber-200/80 text-[11px] leading-relaxed">
                You will only receive 1 chance to submit an upgrade request every 24 hours. Please do not submit fake payments or duplicate screenshots. False submissions will result in permanent account suspension.
              </p>
            </div>

            {/* Selected Package Breakdown Card */}
            <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                  Final Package Breakdown
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

            {/* Step 1: Complete UPI Transfer */}
            <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2.5 text-xs">
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
                Transfer exactly <strong>₹{totalPayable.toLocaleString('en-IN')}</strong> via GPay, PhonePe, Paytm, or BHIM UPI app. Take a screenshot of the completed transfer.
              </p>
            </div>

            {/* Step 2: Attach Payment Screenshot */}
            <div className="p-4 bg-zinc-900/60 border border-white/10 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-sky-400" /> Step 2: Attach Payment Screenshot
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
                  <p className="text-xs font-medium text-white">Click to upload payment screenshot</p>
                  <p className="text-[10px] text-text-tertiary">PNG, JPG, WEBP up to 5MB</p>
                </button>
              )}
            </div>

            {/* Notes / UTR */}
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
          </div>
        )}

      </div>

      {/* Persistent Sticky Pricing Cart Bar at Bottom of Screen */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e13]/95 backdrop-blur-md border-t border-white/10 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Dynamic Selection & Total */}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-bold">
                Selected Package &bull; Step {currentStep} of 4
              </span>
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5 mt-0.5">
                <span className="uppercase font-bold text-accent-blue">{selectedPlan}</span>
                <span className="text-text-tertiary">({cycleObj.label})</span>
                {storageObj.price > 0 && <span className="text-sky-300">&bull; {storageObj.name}</span>}
                {aiObj.price > 0 && <span className="text-emerald-300">&bull; {aiObj.name}</span>}
              </div>
            </div>

            <div className="pl-3 border-l border-white/10 shrink-0">
              <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-bold">Total:</span>
              <span className="text-lg font-extrabold text-white font-mono leading-none">
                ₹{totalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Right: Step Navigation Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 justify-end">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => handleStepProceed(currentStep + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 transition-all flex items-center gap-1.5 shadow-lg shadow-accent-blue/20 cursor-pointer"
              >
                <span>
                  {currentStep === 1 ? 'Proceed to Storage Addon' : currentStep === 2 ? 'Proceed to AI Top-Up' : 'Proceed to Final Checkout'}
                </span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitUpgrade}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-blue hover:bg-accent-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-accent-blue/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Submit Upgrade Request (₹{totalPayable.toLocaleString('en-IN')})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
