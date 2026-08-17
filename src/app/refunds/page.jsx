import { auth } from '@/auth';
import RefundsForm from './RefundsForm';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, XCircle, Clock, CreditCard, ShieldAlert } from 'lucide-react';
import Footer from '@/components/ui/Footer';
import Logo from '@/components/Logo';

export default async function RefundsPage() {
  const session = await auth();

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
              <RefreshCw className="text-accent-blue w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Cancellation & Refund Policy</h1>
          </div>
          <p className="text-text-tertiary">Last Updated: August 17, 2026</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-12 space-y-12">
        <div className="bg-card border border-border-subtle rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
          {/* Subtle glowing effect behind the card */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="prose prose-invert prose-blue max-w-none space-y-10">
            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <XCircle className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">1. Subscriptions & Cancellations</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Automatix operates on a subscription basis. You may cancel your subscription at any time directly from your account dashboard. Upon cancellation, you will retain access to the platform until the end of your current billing cycle.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <Clock className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">2. Refund Eligibility</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Because Automatix offers digital software access and server resources, we generally do not offer refunds for partial months of service or for periods where you did not actively use the platform.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <ShieldAlert className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">3. Exceptions</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                If you experience a severe technical failure that prevents you from using the core features of the funnel builder, and our support team is unable to resolve it within a reasonable timeframe, you may request a pro-rated refund within the first 14 days of your purchase by contacting our support team or filling out the form below.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                <CreditCard className="w-5 h-5 text-accent-blue" />
                <h2 className="text-xl font-semibold text-white m-0">4. Chargebacks</h2>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4 bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-200">
                We ask that you contact our support team to resolve any billing issues before initiating a chargeback with your bank.
              </p>
            </section>
          </div>
        </div>

        {/* Refund Request Form Section */}
        <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">Submit a Refund Request</h2>
            <p className="text-text-secondary mt-2">If you meet the exception criteria, submit a request to our support team.</p>
          </div>
          
          {!session ? (
            <div className="text-center py-8 bg-black/40 rounded-xl border border-white/5">
              <p className="text-text-secondary mb-6">You must be logged into your Automatix account to submit a refund request.</p>
              <Link href="/login">
                <button className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  Login to Submit Request
                </button>
              </Link>
            </div>
          ) : (
            <RefundsForm />
          )}
        </div>
      </div>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );
}
