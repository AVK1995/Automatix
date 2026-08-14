import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8 md:p-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center text-accent-blue hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm text-text-secondary">Last Updated: August 2026</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">1. Introduction</h2>
          <p className="text-text-secondary leading-relaxed">
            At Automatix, your privacy and the security of your data are our highest priorities. This Privacy Policy outlines how we collect, use, and protect the information you provide when using our automation platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">2. Data Minimization & Collection</h2>
          <p className="text-text-secondary leading-relaxed">
            We adhere strictly to the principle of data minimization. We only collect the absolute minimum information required to facilitate the automated workflows you configure.
          </p>
          <ul className="list-disc pl-5 text-text-secondary space-y-2">
            <li><strong>Self-Serve Connections:</strong> If you use our self-serve tools, we collect your provided App IDs, App Secrets, and OAuth tokens solely to route webhook traffic on your behalf.</li>
            <li><strong>Concierge Setup:</strong> If you request our Concierge service, we may collect specific business context (like Facebook Page URLs or business names) necessary to configure your Meta Apps. We do <strong>not</strong> require or store sensitive tax IDs or physical government registration documents on our servers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">3. Military-Grade Encryption</h2>
          <p className="text-text-secondary leading-relaxed">
            Protecting your third-party credentials is our utmost concern.
          </p>
          <ul className="list-disc pl-5 text-text-secondary space-y-2">
            <li><strong>AES-256-GCM Encryption:</strong> Any highly sensitive data you provide, including Meta <code>App Secrets</code>, Access Tokens, and API keys, are encrypted at the database level using industry-standard AES-256-GCM encryption.</li>
            <li><strong>Data in Transit:</strong> Your keys are never stored in plain text and are only decrypted in memory during the split-second required to execute API calls to the respective third-party platforms.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">4. Third-Party Data Processing</h2>
          <p className="text-text-secondary leading-relaxed">
            As an infrastructure provider, Automatix processes data passed between you and third-party platforms (such as Meta) purely to facilitate your automated workflows. We do not sell, rent, or analyze this payload data for our own commercial purposes. You are responsible for ensuring that your collection of end-user data complies with applicable privacy laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">5. Consent</h2>
          <p className="text-text-secondary leading-relaxed">
            By connecting any third-party integration or utilizing our Concierge service, you explicitly consent to the encrypted storage of your connection credentials and acknowledge that Automatix operates strictly as a technological intermediary with no liability over the actions or policies of the third-party platforms.
          </p>
        </section>

        <div className="pt-8 border-t border-white/10 text-sm text-text-tertiary">
          If you have any questions or concerns regarding our privacy practices, please contact support.
        </div>
      </div>
    </div>
  );
}
