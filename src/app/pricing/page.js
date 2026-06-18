import { CheckIcon } from '@/components/Icons';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col items-center py-20 px-4">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl text-center mb-16">
        <div className="inline-block mb-6">
          <Link href="/">
             <div className="w-12 h-12 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-2xl flex items-center justify-center shadow-lg mx-auto hover:scale-105 transition-transform">
               <span className="font-bold text-white text-xl">A</span>
             </div>
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent tracking-tight">Simple, transparent pricing</h1>
        <p className="text-text-secondary text-lg">No hidden fees. Scale your workflow automation effortlessly.</p>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Free Tier */}
        <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl flex flex-col hover:border-white/20 transition-colors">
          <h2 className="text-2xl font-semibold text-white mb-2">Starter</h2>
          <p className="text-text-secondary text-sm mb-6">Perfect for testing and small projects.</p>
          <div className="text-5xl font-bold mb-8">₹0<span className="text-xl text-text-secondary font-medium">/mo</span></div>
          
          <ul className="space-y-5 mb-8 flex-1">
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3" /> Up to 3 Workflows</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3" /> 100 Executions per month</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3" /> Standard Integrations</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-5 h-5 text-white/40 mr-3" /> Community Support</li>
          </ul>

          <button className="w-full py-4 rounded-xl border border-white/10 bg-white/5 text-white/50 text-sm font-semibold cursor-not-allowed">
            Currently Unavailable
          </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#111] border border-accent-violet/30 backdrop-blur-xl rounded-2xl p-8 flex flex-col relative shadow-[0_0_50px_rgba(139,92,246,0.15)] hover:shadow-[0_0_80px_rgba(139,92,246,0.25)] transition-shadow">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-accent-violet to-accent-blue text-white text-[11px] font-bold tracking-widest px-4 py-1.5 rounded-full shadow-lg">
            RECOMMENDED
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-2">Professional</h2>
          <p className="text-white/70 text-sm mb-6">For businesses automating at scale.</p>
          <div className="text-5xl font-bold mb-8 text-white">₹499<span className="text-xl text-white/50 font-medium">/mo</span></div>
          
          <ul className="space-y-5 mb-8 flex-1">
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3" /> Unlimited Workflows</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3" /> 50,000 Executions per month</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3" /> Premium Integrations (Meta, Calendly)</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3" /> Smart Delay Engine</li>
            <li className="flex items-center text-sm text-white"><CheckIcon className="w-5 h-5 text-accent-violet mr-3" /> Priority Email Support</li>
          </ul>

          <div className="p-5 bg-black/40 border border-white/10 rounded-xl text-xs text-white/80 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent-violet to-accent-blue"></div>
            <strong className="block text-white mb-2 text-sm ml-2">Manual Provisioning Only</strong>
            <span className="ml-2 block">We are currently in private beta. To purchase this plan:</span>
            <ol className="list-decimal ml-8 mt-3 space-y-2 text-white/60">
              <li>Send <strong className="text-white">₹499</strong> via UPI to <strong className="text-white">{process.env.PAYMENT_UPI_ID || 'your-upi@bank'}</strong> or via Bank Transfer to <strong className="text-white">{process.env.PAYMENT_BANK_DETAILS || 'Acc: 123456789, IFSC: XXXX00000'}</strong></li>
              <li>Email a screenshot of the receipt to <strong className="text-white">{process.env.PAYMENT_EMAIL || 'billing@automatix.local'}</strong>.</li>
              <li>We will provision your isolated tenant account and email you a secure setup link within 12 hours.</li>
            </ol>
          </div>

          <a href={`mailto:${process.env.PAYMENT_EMAIL || 'billing@automatix.local'}`} className="block text-center w-full py-4 rounded-xl bg-white text-black font-semibold hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300">
            Email Receipt
          </a>
        </div>
      </div>
    </div>
  );
}
