import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-accent-blue hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-sm text-text-secondary">Last Updated: August 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">1. Introduction</h2>
          <p className="text-text-secondary leading-relaxed">
            Welcome to Automatix. These Terms and Conditions govern your use of our platform and services. By accessing or using Automatix, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">2. Role of Automatix (The "Middle-Man" Clause)</h2>
          <p className="text-text-secondary leading-relaxed">
            Automatix acts strictly as an infrastructure provider and a technological "middle-man." Our platform facilitates automation and integration between various third-party services (such as Meta, Instagram, Facebook, and WhatsApp). 
          </p>
          <ul className="list-disc pl-5 text-text-secondary space-y-2">
            <li>We do not own, operate, or control the third-party platforms you connect to.</li>
            <li>We are completely isolated from and hold <strong>zero legal liability</strong> for any bans, suspensions, account restrictions, or policy violations applied to your accounts by Meta or any other third-party service.</li>
            <li>You are solely responsible for ensuring that your automated workflows, messages, and content comply with the Terms of Service and Developer Policies of the respective platforms you use.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">3. "Bring Your Own Key" (BYOK) & Concierge Setup</h2>
          <p className="text-text-secondary leading-relaxed">
            Automatix offers a "Bring Your Own Key" architecture. You are responsible for creating your own Developer Apps and verifying your own businesses on third-party platforms.
          </p>
          <p className="text-text-secondary leading-relaxed">
            If you utilize our optional "Concierge" white-glove setup service, you acknowledge that you are granting our administrators temporary access to your third-party accounts solely for the purpose of technical configuration. We act exclusively on your behalf and accept no liability for the resulting configurations, subsequent account reviews, or data exchanged via those configurations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">4. Limitation of Liability</h2>
          <p className="text-text-secondary leading-relaxed">
            To the maximum extent permitted by law, Automatix and its owner shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or business interruption, arising from your use of the service or any third-party integrations connected through the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">5. User Data and Security</h2>
          <p className="text-text-secondary leading-relaxed">
            While we utilize industry-standard AES-256 encryption to protect your sensitive credentials (such as App Secrets and Access Tokens), you acknowledge that providing this information is done at your own risk. Please refer to our Privacy Policy for more information on how we handle and protect your data.
          </p>
        </section>

        <div className="pt-8 border-t border-white/10 text-sm text-text-tertiary">
          If you have any questions about these Terms, please contact support.
        </div>
      </div>
    </div>
  );
}
