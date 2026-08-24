import { CheckIcon } from '@/components/Icons';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import Logo from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import PublicHeader from '@/components/ui/PublicHeader';

import { auth } from '@/auth';

export default async function PricingPage() {
  const session = await auth();
  const userName = session?.user?.name || '[Your Full Name]';
  const userEmail = session?.user?.email || '[Your Registered Email]';

  const settings = await prisma.platformSettings.findFirst() || {
    starterPlanEnabled: true,
    starterPlanPrice: 0,
    starterPlanDesc: "Perfect for testing and small projects.",
    proPlanEnabled: true,
    proPlanPrice: 499,
    proPlanDesc: "For businesses automating at scale."
  };

  const billingEmail = process.env.PAYMENT_EMAIL || 'billing@automatix.local';
  const emailSubject = encodeURIComponent('Automatix Professional Plan Upgrade');
  const emailBody = encodeURIComponent(`Hello Automatix Team,

Please find my payment receipt attached.

Name: ${userName}
Pre-existing Automatix Account Email: ${userEmail}

(Note: You must have a pre-existing account in Automatix to get access, otherwise your payment cannot be processed and no refund will be provided.)

Thanks!`);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${billingEmail}&su=${emailSubject}&body=${emailBody}`;

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <PublicHeader showBack={true} />

      {/* Main Container constrained to max-w-7xl like dashboard */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-20 flex flex-col items-center flex-1 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-3xl text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent tracking-tight">Simple, transparent pricing</h1>
        <p className="text-text-secondary text-lg">No hidden fees. Scale your workflow automation effortlessly.</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Starter Free Tier */}
        <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl flex flex-col hover:border-white/20 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-2">Starter</h2>
          <p className="text-text-secondary text-sm mb-6">{settings.starterPlanDesc}</p>
          <div className="text-5xl font-bold mb-8">₹0<span className="text-xl text-text-secondary font-medium">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> Up to 3 Workflows</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 100 Executions / month</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 50 MB Cloud Storage</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 10 Images & 1 Video</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> Standard Integrations</li>
          </ul>

          {settings.starterPlanEnabled ? (
            <Link href="/register" className="block text-center w-full py-4 rounded-xl border border-accent-blue bg-accent-blue/10 hover:bg-accent-blue hover:text-white text-accent-blue font-semibold transition-all">
              Get Started for Free
            </Link>
          ) : (
            <button className="w-full py-4 rounded-xl border border-white/10 bg-white/5 text-white/50 text-sm font-semibold cursor-not-allowed" disabled>
              Currently Unavailable
            </button>
          )}
        </div>

        {/* Professional Tier */}
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#111] border border-accent-violet/30 backdrop-blur-xl rounded-2xl p-8 flex flex-col relative shadow-[0_0_50px_rgba(139,92,246,0.15)] hover:shadow-[0_0_80px_rgba(139,92,246,0.25)] transition-shadow">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-accent-violet to-accent-blue text-white text-[11px] font-bold tracking-widest px-4 py-1.5 rounded-full shadow-lg uppercase">
            POPULAR
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-2">Professional</h2>
          <p className="text-white/70 text-sm mb-6">{settings.proPlanDesc}</p>
          <div className="text-5xl font-bold mb-8 text-white">₹{settings.proPlanPrice}<span className="text-xl text-white/50 font-medium">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> Unlimited Workflows</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> 50,000 Executions / month</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> 200 MB Storage Allowance</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> 30 Images & 4 Videos</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> Smart Delay & Branching Router</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3 shrink-0" /> Priority Support</li>
          </ul>

          <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 rounded-xl bg-white text-black font-semibold hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300">
            Upgrade to Professional
          </a>
        </div>

        {/* Enterprise Tier */}
        <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl flex flex-col hover:border-white/20 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-2">Enterprise</h2>
          <p className="text-text-secondary text-sm mb-6">For high-volume brands, agencies, and custom capacity.</p>
          <div className="text-5xl font-bold mb-8">₹1,499<span className="text-xl text-text-secondary font-medium">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> Unlimited Workflows & Triggers</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> Unlimited Workflow Executions</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 500 MB Base Cloud Storage</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 80 Images & 8 High-Res Videos</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> Custom Limit Query Access</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3 shrink-0" /> 24/7 Dedicated Concierge Support</li>
          </ul>

          <Link href="/dashboard/billing" className="block text-center w-full py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all">
            Contact for Enterprise
          </Link>
        </div>
      </div>

      {/* Standalone Add-on Storage Expansion Section */}
      <div className="relative z-10 w-full max-w-5xl mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Standalone Storage Expansion Packs</h2>
          <p className="text-sm text-text-secondary">Need extra media capacity without changing your execution limits? Add a frozen storage pack anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-accent-blue uppercase tracking-wider block mb-1">Starter Boost</span>
              <h3 className="text-xl font-bold text-white mb-2">Starter Pack (+100 MB)</h3>
              <div className="text-3xl font-bold text-white mb-4">₹199<span className="text-sm text-text-secondary font-medium">/mo</span></div>
              <ul className="space-y-2 text-xs text-text-secondary mb-6">
                <li>• +100 MB Cloud Storage</li>
                <li>• +15 Images (Max 2MB each)</li>
                <li>• +2 Videos (Max 25MB each)</li>
              </ul>
            </div>
            <Link href="/dashboard/billing" className="w-full text-center py-2.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
              Get Starter Pack
            </Link>
          </div>

          <div className="bg-[#111] border border-accent-blue/40 rounded-xl p-6 flex flex-col justify-between shadow-lg shadow-accent-blue/5">
            <div>
              <span className="text-xs font-semibold text-accent-blue uppercase tracking-wider block mb-1">Creator Choice</span>
              <h3 className="text-xl font-bold text-white mb-2">Growth Pack (+250 MB)</h3>
              <div className="text-3xl font-bold text-white mb-4">₹499<span className="text-sm text-text-secondary font-medium">/mo</span></div>
              <ul className="space-y-2 text-xs text-text-secondary mb-6">
                <li>• +250 MB Cloud Storage</li>
                <li>• +40 Images (Max 5MB each)</li>
                <li>• +5 Videos (Max 35MB each)</li>
              </ul>
            </div>
            <Link href="/dashboard/billing" className="w-full text-center py-2.5 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors">
              Get Growth Pack
            </Link>
          </div>

          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-accent-violet uppercase tracking-wider block mb-1">Agency Power</span>
              <h3 className="text-xl font-bold text-white mb-2">Power Pack (+500 MB)</h3>
              <div className="text-3xl font-bold text-white mb-4">₹899<span className="text-sm text-text-secondary font-medium">/mo</span></div>
              <ul className="space-y-2 text-xs text-text-secondary mb-6">
                <li>• +500 MB Cloud Storage</li>
                <li>• +80 Images (Max 8MB each)</li>
                <li>• +8 Videos (Max 50MB each)</li>
              </ul>
            </div>
            <Link href="/dashboard/billing" className="w-full text-center py-2.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
              Get Power Pack
            </Link>
          </div>
        </div>
      </div>
      </div>

      <div className="w-full mt-12 border-t border-border-subtle bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
