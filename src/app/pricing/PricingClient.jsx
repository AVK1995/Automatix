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
  ShieldCheck, 
  HardDrive, 
  Coins, 
  ChevronDown, 
  ArrowUpRight 
} from 'lucide-react';
import PlanUpgradeModal from '@/components/ui/PlanUpgradeModal';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', multiplier: 1 },
  { id: 'quarterly', label: 'Quarterly (3 Months)', multiplier: 3 },
  { id: 'yearly', label: 'Yearly (12 Months)', multiplier: 12 },
];

const STORAGE_OPTIONS = [
  { id: 'none', label: 'No Storage Add-on (+₹0)', price: 0, mb: 0 },
  { id: 'starter_100', label: 'Starter Pack (+100 MB) — +₹99', price: 99, mb: 100 },
  { id: 'growth_250', label: 'Growth Pack (+250 MB) — +₹199', price: 199, mb: 250 },
  { id: 'power_500', label: 'Power Pack (+500 MB) — +₹349', price: 349, mb: 500 },
];

const AI_OPTIONS = [
  { id: 'none', label: 'No AI Top-Up (+₹0)', price: 0, credits: 0 },
  { id: 'ai_50', label: 'Starter AI (+50 Credits) — +₹99', price: 99, credits: 50 },
  { id: 'ai_150', label: 'Pro AI (+150 Credits) — +₹249', price: 249, credits: 150 },
  { id: 'ai_500', label: 'Ultra AI (+500 Credits) — +₹599', price: 599, credits: 500 },
];

export default function PricingClient({ session, settings }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState('pro'); // 'starter' | 'pro' | 'enterprise'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [selectedStorage, setSelectedStorage] = useState('none');
  const [selectedAi, setSelectedAi] = useState('none');

  // Custom Dropdown Open States
  const [storageOpen, setStorageOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const storageRef = useRef(null);
  const aiRef = useRef(null);
  const addonsSectionRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (storageRef.current && !storageRef.current.contains(e.target)) {
        setStorageOpen(false);
      }
      if (aiRef.current && !aiRef.current.contains(e.target)) {
        setAiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        localStorage.removeItem('automatix_pending_plan_selection');
        // If user is authenticated, open modal at checkout
        if (session?.user) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-plan-modal', {
              detail: {
                plan: parsed.plan || 'pro',
                cycle: parsed.cycle || 'monthly',
                storage: parsed.storage || 'none',
                ai: parsed.ai || 'none',
                step: 4
              }
            }));
          }, 300);
        }
      }
    } catch {}
  }, [session]);

  const cycleMultiplier = BILLING_CYCLES.find(c => c.id === billingCycle)?.multiplier || 1;
  const proPrice = (settings?.proPlanPrice || 499) * cycleMultiplier;
  const entPrice = 1499 * cycleMultiplier;

  const storageObj = STORAGE_OPTIONS.find(s => s.id === selectedStorage) || STORAGE_OPTIONS[0];
  const aiObj = AI_OPTIONS.find(a => a.id === selectedAi) || AI_OPTIONS[0];

  const currentPlanPrice = selectedPlan === 'pro' ? proPrice : selectedPlan === 'enterprise' ? entPrice : 0;
  const totalPayable = currentPlanPrice + storageObj.price + aiObj.price;

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    // Smoothly scroll down to addons / checkout section
    if (addonsSectionRef.current) {
      addonsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleLaunchCheckout = () => {
    if (!session?.user) {
      // Save state to localStorage and redirect to register
      localStorage.setItem('automatix_pending_plan_selection', JSON.stringify({
        plan: selectedPlan,
        cycle: billingCycle,
        storage: selectedStorage,
        ai: selectedAi
      }));
      router.push(`/register?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    window.dispatchEvent(new CustomEvent('open-plan-modal', {
      detail: {
        plan: selectedPlan,
        cycle: billingCycle,
        storage: selectedStorage,
        ai: selectedAi,
        step: 4
      }
    }));
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center relative overflow-hidden py-10 md:py-16 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header Section */}
      <div className="relative z-10 w-full max-w-3xl text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
          <span>Transparent Automation Tiers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 text-white tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Scale your workflow automation, AI processing, and cloud storage with zero hidden fees.
        </p>

        {/* Global Billing Cycle Selector */}
        <div className="mt-6 inline-flex p-1 bg-[#111] border border-white/10 rounded-xl">
          {BILLING_CYCLES.map(cycle => (
            <button
              key={cycle.id}
              type="button"
              onClick={() => setBillingCycle(cycle.id)}
              className={`px-3.5 sm:px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {/* Main Pricing Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-6xl mx-auto items-stretch">
        
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
              {settings?.starterPlanDesc || 'Perfect for testing and small personal projects.'}
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
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> Standard Integrations</div>
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
        <div className={`bg-gradient-to-b from-[#18122B] via-[#100c1e] to-[#0d0d12] border-2 rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative shadow-xl transition-all ${
          selectedPlan === 'pro' ? 'border-accent-blue ring-2 ring-accent-blue/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : 'border-purple-500/40 hover:border-purple-500/70'
        }`}>
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
              {settings?.proPlanDesc || 'For businesses and creators automating workflows at scale.'}
            </p>
            <div className="text-3xl lg:text-4xl font-extrabold mb-5 text-white font-mono">
              ₹{proPrice.toLocaleString('en-IN')}<span className="text-xs text-text-tertiary font-medium font-sans"> / {billingCycle === 'monthly' ? 'month' : billingCycle === 'quarterly' ? '3 months' : 'year'}</span>
            </div>
            
            <div className="space-y-3 mb-6 border-t border-white/10 pt-5 text-xs text-white">
              <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 100 Workflows</div>
              <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 5,000 Executions / month</div>
              <div className="flex items-center font-semibold text-accent-blue"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 100 AI Credits / month</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 200 MB Storage Allowance</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> 30 Images & 4 Videos (25MB max)</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-accent-blue mr-2.5 shrink-0" /> Priority Webhook Triggers</div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => handlePlanSelect('pro')}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedPlan === 'pro'
                  ? 'bg-accent-blue text-white shadow-md shadow-accent-blue/30'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              <span>{selectedPlan === 'pro' ? 'Selected Plan ✓' : 'Select Plan'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 3. Enterprise Tier */}
        <div className={`bg-[#0f0f13] border rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between transition-all ${
          selectedPlan === 'enterprise' ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/[0.03]' : 'border-white/10 hover:border-amber-500/40'
        }`}>
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
              For high-volume agency operations, custom CRM webhooks, and scale.
            </p>
            <div className="text-3xl lg:text-4xl font-extrabold mb-5 text-white font-mono">
              ₹{entPrice.toLocaleString('en-IN')}<span className="text-xs text-text-tertiary font-medium font-sans"> / {billingCycle === 'monthly' ? 'month' : billingCycle === 'quarterly' ? '3 months' : 'year'}</span>
            </div>
            
            <div className="space-y-3 mb-6 border-t border-white/5 pt-5 text-xs text-text-secondary">
              <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> Custom Workflows</div>
              <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> 25k+ Workflow Executions</div>
              <div className="flex items-center text-amber-200"><CheckIcon className="w-4 h-4 text-amber-400 mr-2.5 shrink-0" /> 500 AI Credits / month</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 500 MB Base Cloud Storage</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 80 Images & 8 High-Res Videos</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-2.5 shrink-0" /> 24/7 Concierge Support</div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => handlePlanSelect('enterprise')}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedPlan === 'enterprise'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'border border-white/20 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <Crown size={13} className={selectedPlan === 'enterprise' ? 'text-black' : 'text-amber-400'} />
              <span>{selectedPlan === 'enterprise' ? 'Selected Plan ✓' : 'Select Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add-On Dropdowns & Dynamic Checkout Section */}
      <div 
        ref={addonsSectionRef} 
        className="relative z-10 w-full max-w-6xl mx-auto mt-10 p-5 sm:p-6 rounded-2xl bg-[#0f0f13] border border-white/10 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-blue" />
              <span>Customize with Add-ons (Optional)</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Add standalone storage buffers or AI credit boosters to your selection without modal popups.
            </p>
          </div>

          <div className="text-xs text-text-tertiary font-mono">
            Selected Tier: <strong className="text-white uppercase">{selectedPlan}</strong> ({BILLING_CYCLES.find(c => c.id === billingCycle)?.label})
          </div>
        </div>

        {/* 2 Custom Headless Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Dropdown 1: Storage Packs */}
          <div ref={storageRef} className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <HardDrive size={14} className="text-sky-400" />
              <span>Explore Storage Packs:</span>
            </label>
            <button
              type="button"
              onClick={() => setStorageOpen(!storageOpen)}
              className="w-full bg-black/60 border border-white/10 hover:border-sky-400/50 rounded-xl px-3.5 py-2.5 text-xs text-left text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="font-medium truncate">{storageObj.label}</span>
              <ChevronDown size={14} className={`text-text-tertiary transition-transform shrink-0 ml-2 ${storageOpen ? 'rotate-180' : ''}`} />
            </button>

            {storageOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#141419] border border-white/15 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {STORAGE_OPTIONS.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSelectedStorage(opt.id);
                      setStorageOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedStorage === opt.id ? 'bg-accent-blue/15 text-accent-blue font-bold' : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedStorage === opt.id && <Check size={13} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 2: AI Credit Packs */}
          <div ref={aiRef} className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Coins size={14} className="text-emerald-400" />
              <span>Top Up AI Credits:</span>
            </label>
            <button
              type="button"
              onClick={() => setAiOpen(!aiOpen)}
              className="w-full bg-black/60 border border-white/10 hover:border-emerald-400/50 rounded-xl px-3.5 py-2.5 text-xs text-left text-white flex items-center justify-between transition-all cursor-pointer"
            >
              <span className="font-medium truncate">{aiObj.label}</span>
              <ChevronDown size={14} className={`text-text-tertiary transition-transform shrink-0 ml-2 ${aiOpen ? 'rotate-180' : ''}`} />
            </button>

            {aiOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#141419] border border-white/15 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {AI_OPTIONS.map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => {
                      setSelectedAi(opt.id);
                      setAiOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedAi === opt.id ? 'bg-accent-blue/15 text-accent-blue font-bold' : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedAi === opt.id && <Check size={13} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Final Calculation & Proceed Button Bar */}
        <div className="p-4 bg-black/50 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 text-xs">
            <span className="text-text-tertiary block">Total Calculated Payable:</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center gap-2">
              <span>₹{totalPayable.toLocaleString('en-IN')}</span>
              <span className="text-[11px] font-sans font-normal text-text-tertiary">
                ({selectedPlan === 'pro' ? 'Pro' : 'Enterprise'} + {storageObj.mb > 0 ? `+${storageObj.mb}MB Storage` : 'Base Storage'} + {aiObj.credits > 0 ? `+${aiObj.credits} AI Credits` : 'Base Credits'})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchCheckout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 cursor-pointer"
          >
            <span>Proceed to Checkout (₹{totalPayable.toLocaleString('en-IN')})</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Global Plan Upgrade Modal Component */}
      <PlanUpgradeModal />
    </div>
  );
}
