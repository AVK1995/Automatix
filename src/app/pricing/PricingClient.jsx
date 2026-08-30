'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon } from '@/components/Icons';
import { Sparkles, Crown, Zap, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import PlanUpgradeModal from '@/components/ui/PlanUpgradeModal';

export default function PricingClient({ session, settings }) {
  const [modalTab, setModalTab] = useState('pro');

  const openModal = (tab) => {
    window.dispatchEvent(new CustomEvent('open-plan-modal', { detail: { tab } }));
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center relative overflow-hidden py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header Section */}
      <div className="relative z-10 w-full max-w-3xl text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
          <span>Transparent Automation Tiers</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          No hidden fees. Scale your workflow automation, AI vision processing, and cloud storage effortlessly.
        </p>
      </div>

      {/* Main Pricing Cards Grid (Properly adjusted width max-w-6xl) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-6xl mx-auto items-stretch">
        
        {/* 1. Starter Free Tier */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-7 md:p-8 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Starter</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                FREE TIER
              </span>
            </div>
            <p className="text-text-secondary text-xs mb-6 min-h-[32px]">
              {settings?.starterPlanDesc || 'Perfect for testing and small projects.'}
            </p>
            <div className="text-4xl lg:text-5xl font-extrabold mb-6 text-white">
              ₹0<span className="text-base lg:text-lg text-text-secondary font-medium">/mo</span>
            </div>
            
            <div className="space-y-3.5 mb-8 border-t border-white/5 pt-6 text-xs text-text-secondary">
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> Up to 3 Workflows</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 100 Executions / month</div>
              <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-emerald-400 mr-3 shrink-0" /> 10 AI Credits / month</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 50 MB Cloud Storage</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 10 Images & 1 Video (25MB max)</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> Standard Integrations</div>
            </div>
          </div>

          <div>
            <Link 
              href="/register" 
              className="block text-center w-full py-3.5 rounded-xl border border-accent-blue bg-accent-blue/10 hover:bg-accent-blue hover:text-white text-accent-blue font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              Get Started for Free
            </Link>
          </div>
        </div>

        {/* 2. Professional Tier (Featured) */}
        <div className="bg-gradient-to-b from-[#18122B] via-[#100c1e] to-[#0d0d12] border-2 border-purple-500/40 rounded-2xl p-7 md:p-8 flex flex-col justify-between relative shadow-[0_0_50px_rgba(139,92,246,0.2)] hover:shadow-[0_0_70px_rgba(139,92,246,0.3)] transition-all duration-300">
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-sky-500 text-white text-[10px] font-extrabold tracking-widest px-3.5 py-1 rounded-full shadow-lg uppercase flex items-center gap-1">
            <Zap size={11} /> MOST POPULAR
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Professional</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO LICENSE
              </span>
            </div>
            <p className="text-purple-200/70 text-xs mb-6 min-h-[32px]">
              {settings?.proPlanDesc || 'For businesses automating at scale.'}
            </p>
            <div className="text-4xl lg:text-5xl font-extrabold mb-6 text-white font-mono">
              ₹{settings?.proPlanPrice || 499}<span className="text-base lg:text-lg text-purple-300/60 font-medium font-sans">/mo</span>
            </div>
            
            <div className="space-y-3.5 mb-8 border-t border-purple-500/20 pt-6 text-xs text-white">
              <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> 100 Workflows</div>
              <div className="flex items-center font-medium"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> 5,000 Executions / month</div>
              <div className="flex items-center font-semibold text-purple-200"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> 100 AI Credits / month</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> 200 MB Storage Allowance</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> 30 Images & 4 Videos (25MB max)</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> Smart Delay & Branching Router</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-purple-400 mr-3 shrink-0" /> Priority Support & Webhook Trigger Locks</div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => openModal('pro')}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-xs hover:scale-[1.02] hover:bg-zinc-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Upgrade to Professional</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* 3. Enterprise Tier */}
        <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-7 md:p-8 shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                <span>Enterprise</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                CUSTOM SCALE
              </span>
            </div>
            <p className="text-text-secondary text-xs mb-6 min-h-[32px]">
              For high-volume brands, agencies, and custom capacity.
            </p>
            <div className="text-4xl lg:text-5xl font-extrabold mb-6 text-white font-mono">
              ₹1,499<span className="text-base lg:text-lg text-text-secondary font-medium font-sans">/mo</span>
            </div>
            
            <div className="space-y-3.5 mb-8 border-t border-white/5 pt-6 text-xs text-text-secondary">
              <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-3 shrink-0" /> Custom Workflows</div>
              <div className="flex items-center text-white"><CheckIcon className="w-4 h-4 text-amber-400 mr-3 shrink-0" /> Custom Workflow Executions</div>
              <div className="flex items-center text-amber-200"><CheckIcon className="w-4 h-4 text-amber-400 mr-3 shrink-0" /> Custom AI Credits</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 500 MB Base Cloud Storage</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 80 Images & 8 High-Res Videos</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> Custom Limit Query Access</div>
              <div className="flex items-center"><CheckIcon className="w-4 h-4 text-white/40 mr-3 shrink-0" /> 24/7 Dedicated Concierge Support</div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => openModal('enterprise')}
              className="w-full py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-amber-500/40 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Crown size={14} className="text-amber-400" />
              <span>Contact for Enterprise</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add-On Quick Access Banner */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-12 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Need Standalone Storage or AI Credits?</span>
          </h3>
          <p className="text-xs text-text-tertiary">
            Add high-capacity storage buffers (+100MB, +250MB, +500MB) or one-time AI credit boosters without changing your subscription tier.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openModal('storage')}
            className="px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            Explore Storage Packs
          </button>
          <button
            type="button"
            onClick={() => openModal('ai')}
            className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            Top Up AI Credits
          </button>
        </div>
      </div>

      {/* Global Plan Upgrade Modal Component */}
      <PlanUpgradeModal />
    </div>
  );
}
