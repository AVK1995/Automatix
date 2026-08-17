import React from 'react';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import { ArrowLeft, ScrollText, Scale, ShieldAlert, Cpu, AlertTriangle, XOctagon, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header section with subtle gradient */}
      <div className="relative pt-16 pb-12 border-b border-border-subtle bg-gradient-to-b from-accent-blue/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-blue/10 via-background to-background opacity-50"></div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-accent-blue transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ScrollText className="text-accent-blue w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Terms of Service</h1>
          </div>
          <p className="text-text-tertiary">Last Updated: August 17, 2026</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-12">
        <div className="bg-card border border-border-subtle rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
          {/* Subtle glowing effect behind the card */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="prose prose-invert prose-blue max-w-none space-y-10">
            <p className="text-text-secondary leading-relaxed text-lg">
              By accessing or using the Automatix web application, you agree to be bound by these Terms of Service.
            </p>

            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Cpu className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">1. Service Description</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Automatix is a software-as-a-service (SaaS) platform providing funnel building, automation logic, and webhook integration tools.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Scale className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">2. Acceptable Use and Meta Compliance</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                You agree not to use Automatix for any illegal or unauthorized purpose. If you utilize our WhatsApp or Meta API integrations, you agree to comply strictly with the Meta Business Messaging Policies and WhatsApp Commerce Policies. Any violation of Meta's terms that results in the suspension of our API access may result in the immediate termination of your Automatix account.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <ShieldAlert className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">3. Intellectual Property</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                All code, design, and architecture of the Automatix platform are the exclusive property of Automatix. You retain full ownership of the content, text, and customer data you generate using our funnel builder.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <AlertTriangle className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">4. Limitation of Liability</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Automatix provides its service "as is." We are not liable for any lost profits, lost data, or business interruption resulting from your use of our tools or from unexpected downtime in third-party APIs (such as Meta, Stripe, or Razorpay).
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <XOctagon className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">5. Termination</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                We reserve the right to suspend or terminate your account at any time if you breach these terms.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Mail className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">6. Contact</h2>
              </div>
              <div className="text-text-secondary leading-relaxed mt-4 bg-background/50 border border-border-subtle p-5 rounded-lg inline-block w-full">
                <div className="font-medium">
                  <p className="text-white">Automatix</p>
                  <p>Solapur, Maharashtra, India</p>
                  <p className="mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:abhishekkamble0123@gmail.com" className="text-accent-blue hover:underline">abhishekkamble0123@gmail.com</a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
