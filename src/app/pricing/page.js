import { CheckIcon } from '@/components/Icons';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-20 px-4">
      <div className="max-w-3xl w-full text-center mb-16">
        <h1 className="text-4xl font-semibold mb-4 text-foreground tracking-tight">Simple, transparent pricing</h1>
        <p className="text-text-secondary text-lg">No hidden fees. Scale your workflow automation effortlessly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Free Tier */}
        <div className="border border-border-subtle bg-card rounded-sm p-8 flex flex-col">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Starter</h2>
          <p className="text-text-secondary text-sm mb-6">Perfect for testing and small projects.</p>
          <div className="text-4xl font-semibold mb-8">$0<span className="text-lg text-text-secondary font-normal">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-4 h-4 text-accent-blue mr-3" /> Up to 3 Workflows</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-4 h-4 text-accent-blue mr-3" /> 100 Executions per month</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-4 h-4 text-accent-blue mr-3" /> Standard Integrations</li>
            <li className="flex items-center text-sm text-text-secondary"><CheckIcon className="w-4 h-4 text-accent-blue mr-3" /> Community Support</li>
          </ul>

          <button className="w-full py-3 rounded-sm border border-border-subtle bg-background text-text-secondary text-sm font-medium cursor-not-allowed opacity-50">
            Currently Unavailable
          </button>
        </div>

        {/* Pro Tier */}
        <div className="border border-accent-violet/50 bg-card rounded-sm p-8 flex flex-col relative shadow-[0_0_30px_rgba(139,92,246,0.05)]">
          <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-accent-violet text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full">
            RECOMMENDED
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Professional</h2>
          <p className="text-text-secondary text-sm mb-6">For businesses automating at scale.</p>
          <div className="text-4xl font-semibold mb-8">$49<span className="text-lg text-text-secondary font-normal">/mo</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-sm text-foreground"><CheckIcon className="w-4 h-4 text-accent-violet mr-3" /> Unlimited Workflows</li>
            <li className="flex items-center text-sm text-foreground"><CheckIcon className="w-4 h-4 text-accent-violet mr-3" /> 50,000 Executions per month</li>
            <li className="flex items-center text-sm text-foreground"><CheckIcon className="w-4 h-4 text-accent-violet mr-3" /> Premium Integrations (Meta, Calendly)</li>
            <li className="flex items-center text-sm text-foreground"><CheckIcon className="w-4 h-4 text-accent-violet mr-3" /> Smart Delay Engine</li>
            <li className="flex items-center text-sm text-foreground"><CheckIcon className="w-4 h-4 text-accent-violet mr-3" /> Priority Email Support</li>
          </ul>

          <div className="p-5 bg-background border border-border-subtle rounded-sm text-xs text-text-secondary mb-6">
            <strong className="block text-foreground mb-2 text-sm">Manual Provisioning Only</strong>
            We are currently in private beta. To purchase this plan:
            <ol className="list-decimal ml-5 mt-3 space-y-2 text-text-secondary">
              <li>Send <strong className="text-foreground">$49</strong> via Bank Transfer/PayPal to <strong className="text-foreground">billing@automatix.local</strong></li>
              <li>Email a screenshot of the receipt to the same address.</li>
              <li>We will provision your isolated tenant account and email you a secure setup link within 12 hours.</li>
            </ol>
          </div>

          <a href="mailto:billing@automatix.local" className="block text-center w-full py-3 rounded-sm bg-accent-violet text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Email Receipt
          </a>
        </div>
      </div>
    </div>
  );
}
