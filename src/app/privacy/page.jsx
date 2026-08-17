import React from 'react';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import { ArrowLeft, ShieldCheck, Database, Lock, Trash2, Mail } from 'lucide-react';

export default function PrivacyPage() {
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
              <ShieldCheck className="text-accent-blue w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Privacy Policy</h1>
          </div>
          <p className="text-text-tertiary">Last Updated: August 15, 2026</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-12">
        <div className="bg-card border border-border-subtle rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
          {/* Subtle glowing effect behind the card */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="prose prose-invert prose-blue max-w-none space-y-10">
            <p className="text-text-secondary leading-relaxed text-lg">
              Welcome to Automatix. This Privacy Policy explains how we collect, use, and protect your information when you use our web application, funnel builder, and automated messaging services.
            </p>

            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Database className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">1. Information We Collect</h2>
              </div>
              <ul className="space-y-3 mt-4 text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                  <p><strong>Account Data:</strong> When you register, we collect your name, email address, and billing information.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                  <p><strong>Integration Data:</strong> If you connect third-party accounts (e.g., Meta, WhatsApp Cloud API, Instagram Graph API), we securely store the authentication tokens necessary to operate the services.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                  <p><strong>End-User Data:</strong> Through your use of our funnel tools and webhooks, you may collect data from your own customers. We act strictly as a data processor for this information.</p>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Lock className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">2. How We Use Your Information</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                We use your data solely to provide, maintain, and improve the Automatix platform, to process your transactions, and to facilitate API communications between your connected services.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <ShieldCheck className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">3. Meta API Usage & Data Handling</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Automatix uses the WhatsApp Cloud API and Meta Graph APIs to provide automation services.
              </p>
              <ul className="space-y-3 mt-2 text-text-secondary">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                  <p>We do not use messaging data obtained via Meta APIs for our own advertising purposes.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 shrink-0"></div>
                  <p>We do not sell, rent, or trade your data or your end-users' data to third parties.</p>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Trash2 className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">4. Data Deletion Instructions (Meta Compliance)</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                You have the right to request the complete deletion of your data from our servers. 
                If you wish to remove your account and all associated data (including Meta API tokens), please send an email to <a href="mailto:abhishekkamble0123@gmail.com" className="text-accent-blue hover:underline">abhishekkamble0123@gmail.com</a> with the subject line <strong>"Data Deletion Request."</strong> We will permanently wipe your account records within 7 business days.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Mail className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">5. Contact Us</h2>
              </div>
              <div className="text-text-secondary leading-relaxed mt-4 bg-background/50 border border-border-subtle p-5 rounded-lg inline-block w-full">
                <p>For any privacy-related questions, contact us at:</p>
                <div className="mt-3 font-medium">
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
