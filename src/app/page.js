import Link from 'next/link';
import { auth } from '@/auth';
import Footer from '@/components/ui/Footer';
import PublicHeader from '@/components/ui/PublicHeader';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Code2, 
  Database, 
  Bot, 
  Clock, 
  BarChart3, 
  Layers, 
  ChevronRight, 
  Lock, 
  Check,
  Workflow,
  HelpCircle,
  Play,
  Send,
  Webhook
} from 'lucide-react';
import { 
  GoogleSheetsIcon, 
  InstagramIcon, 
  StripeIcon, 
  MetaIcon, 
  AiBrainIcon 
} from '@/components/Icons';

export default async function Home() {
  const session = await auth();

  const ctaLink = session 
    ? (session.user.role === 'ADMIN' ? '/admin' : '/dashboard') 
    : '/register';

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col selection:bg-accent-blue/30 selection:text-white">
      {/* Top Navigation */}
      <PublicHeader showBack={false} />

      <main className="flex-1 w-full flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-white/5">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-blue/15 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute top-32 right-1/4 w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Live Engine Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#111] text-xs font-medium text-text-secondary mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white font-semibold">Engine v2.0 Live</span>
              <span className="text-white/30">•</span>
              <span className="text-emerald-400">Meta WhatsApp & Vision AI Ready</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-5xl mb-6">
              Automate Without Limits. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-white/90 to-accent-blue bg-clip-text text-transparent">
                Connect Everything Visually.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-text-secondary max-w-3xl mb-10 leading-relaxed font-normal">
              The high-performance visual automation engine for modern teams. Orchestrate WhatsApp Cloud API, Instagram DM, Google Sheets, Meta Ads CAPI, and Vision AI with sub-second dispatch and zero code headaches.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-10">
              <Link href={ctaLink} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40 active:scale-[0.98] cursor-pointer text-sm sm:text-base">
                  <span>{session ? 'Go to Workspace' : 'Start Building Free'}</span>
                  <ArrowRight size={18} className="shrink-0" />
                </button>
              </Link>

              <Link href="/pricing" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer text-sm sm:text-base">
                  <Sparkles size={16} className="text-yellow-400 shrink-0" />
                  <span>View Plans & Pricing</span>
                </button>
              </Link>
            </div>

            {/* Trust Checklist */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Zero Setup Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>99.99% Execution Uptime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Direct Meta Billing (No Markups)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>Enterprise AES-256 Encryption</span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE WORKFLOW CANVAS SHOWCASE */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Live Flow Canvas</h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">Visual, Deterministic, Resilient</p>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Header bar of canvas */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-text-tertiary ml-2">Workflow: High-Value Lead Nurture & Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active • 98ms latency
                </span>
              </div>
            </div>

            {/* Workflow Pipeline Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1: Trigger */}
              <div className="bg-[#151518] border border-emerald-500/30 rounded-xl p-4 flex flex-col relative group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Step 1 • Trigger
                  </span>
                  <Zap size={14} className="text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">WhatsApp Inbound</h4>
                    <p className="text-[10px] text-text-tertiary">Meta Cloud Webhook</p>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono text-emerald-300/80 bg-black/40 rounded p-2 border border-white/5">
                  event: message_received
                </div>
              </div>

              {/* Step 2: AI Mediator */}
              <div className="bg-[#151518] border border-purple-500/30 rounded-xl p-4 flex flex-col relative group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Step 2 • Action
                  </span>
                  <Bot size={14} className="text-purple-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    <AiBrainIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI Content Engine</h4>
                    <p className="text-[10px] text-text-tertiary">Intent & Media Extraction</p>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono text-purple-300/80 bg-black/40 rounded p-2 border border-white/5">
                  intent: &quot;high_ticket_quote&quot;
                </div>
              </div>

              {/* Step 3: Google Sheets Sync */}
              <div className="bg-[#151518] border border-green-500/30 rounded-xl p-4 flex flex-col relative group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    Step 3 • Action
                  </span>
                  <Database size={14} className="text-green-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">
                    <GoogleSheetsIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Google Sheets</h4>
                    <p className="text-[10px] text-text-tertiary">Append Client Row</p>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono text-green-300/80 bg-black/40 rounded p-2 border border-white/5">
                  row: [name, phone, quote]
                </div>
              </div>

              {/* Step 4: Meta CAPI Dispatch */}
              <div className="bg-[#151518] border border-blue-500/30 rounded-xl p-4 flex flex-col relative group shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    Step 4 • Action
                  </span>
                  <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <MetaIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Meta Ads CAPI</h4>
                    <p className="text-[10px] text-text-tertiary">Server-Side Conversion</p>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono text-blue-300/80 bg-black/40 rounded p-2 border border-white/5">
                  event: &quot;LeadQualified&quot;
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES BENTO GRID */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Native Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Engineered for Maximum Reliability</h3>
            <p className="text-text-secondary text-sm sm:text-base">Everything modern marketers, automation architects, and founders need to scale operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: WhatsApp Cloud API */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <Smartphone size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Meta WhatsApp Cloud API</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Design, preview, and submit Meta-approved Marketing, Utility, and Authentication templates directly inside Automatix. Direct Meta billing means 0% payment markup.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Interactive CTA & Quick Reply buttons</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Media headers (Images, Videos, PDFs)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Dynamic variables {"{{1}}"}, {"{{2}}"}</li>
              </ul>
            </div>

            {/* Card 2: Instagram DM & Publish */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-pink-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                  <InstagramIcon size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Instagram DM & Publishing</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Trigger automated replies when prospective leads DM keyword triggers, or schedule automated Feed Posts, Reels, and Stories directly from cloud storage.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Exact & fuzzy keyword matching</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Interactive prompt & reply nodes</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-pink-400" /> Cloud drive auto-publisher</li>
              </ul>
            </div>

            {/* Card 3: AI Vision & Mediation */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-purple-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <AiBrainIcon size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">AI Content & Vision Engine</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Analyze incoming images, extract document details, summarize customer requests, and dynamically route workflows with Google Gemini or bring-your-own keys.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Multimodal vision & OCR extraction</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Sentiment analysis & intent classification</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Structured JSON outputs for steps</li>
              </ul>
            </div>

            {/* Card 4: Google Sheets & Databases */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4">
                  <GoogleSheetsIcon size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Google Sheets Two-Way Sync</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Append rows, look up records, or trigger automations when new spreadsheet rows appear. Verified Google Cloud service account authentication with setup wizard.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Append or update matching rows</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Dynamic variable mapping</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Instant step test & verification</li>
              </ul>
            </div>

            {/* Card 5: Meta Conversions API (CAPI) */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <MetaIcon size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Meta Ads Conversions API</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Bypass ad-blockers and iOS privacy restrictions. Send server-side conversion events (Purchases, Leads, Schedule) directly from workflow steps to Meta Ads.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-400" /> SHA-256 hashed customer data</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-400" /> Enhanced match quality scoring</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-blue-400" /> Direct Pixel & Token validation</li>
              </ul>
            </div>

            {/* Card 6: Smart Delays & Reminders */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4">
                  <Clock size={20} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Smart Delays & Sequences</h4>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Pause workflow execution for durations (minutes, hours, days), wait until a specific appointment time, or halt if the customer replies beforehand.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-text-tertiary border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={14} className="text-yellow-400" /> Relative & absolute time delays</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-yellow-400" /> Auto-cancel upon reply event</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-yellow-400" /> Multi-branch reminder timelines</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PERFORMANCE & STATS METRICS */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl border-t border-white/5">
          <div className="bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-white/10 rounded-3xl p-8 sm:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-5xl font-extrabold text-white mb-1 tracking-tight">99.99%</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Engine Uptime</p>
              </div>
              <div>
                <p className="text-3xl sm:text-5xl font-extrabold text-accent-blue mb-1 tracking-tight">&lt; 150ms</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Trigger Ingestion</p>
              </div>
              <div>
                <p className="text-3xl sm:text-5xl font-extrabold text-emerald-400 mb-1 tracking-tight">0%</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Meta Markup Fee</p>
              </div>
              <div>
                <p className="text-3xl sm:text-5xl font-extrabold text-purple-400 mb-1 tracking-tight">256-bit</p>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">AES Key Encryption</p>
              </div>
            </div>
          </div>
        </section>

        {/* INTEGRATIONS SHOWCASE */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl border-t border-white/5 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Connects With Your Stack</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-8">Seamless Native Integrations</h3>

          <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
            {[
              { name: 'WhatsApp Cloud API', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
              { name: 'Instagram DM & Publish', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
              { name: 'Google Sheets', color: 'text-green-400 border-green-500/20 bg-green-500/5' },
              { name: 'Meta Ads CAPI', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
              { name: 'Stripe Payments', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
              { name: 'Google Drive Storage', color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
              { name: 'Resend & SMTP', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
              { name: 'Twilio SMS', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
              { name: 'Slack Notifications', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
              { name: 'Custom HTTP Webhooks', color: 'text-accent-blue border-accent-blue/20 bg-accent-blue/5' }
            ].map(item => (
              <span key={item.name} className={`px-4 py-2 rounded-xl text-xs font-medium border ${item.color}`}>
                {item.name}
              </span>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-blue mb-2">Got Questions?</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-1.5">How does WhatsApp Cloud API pricing work?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                You connect your own Meta WhatsApp Business Account directly. Meta charges you directly at their official rates (with 1,000 free service conversations every month). Automatix adds zero markups on messages.
              </p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-1.5">Do I need coding skills to build workflows?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                No. The Automatix Visual Flow Canvas allows you to drag, configure, and link triggers and actions visually. If you do know JavaScript, you can write custom snippet nodes for advanced transformations.
              </p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-1.5">Can I test steps before publishing live?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Yes! Every node has a built-in step debugger that lets you test payloads, verify API responses, and validate credentials before activating the workflow.
              </p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-1.5">Are setup guides provided for connections?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Yes. Every connection modal (Google Sheets, Instagram, Facebook, SMTP, and WhatsApp) contains a step-by-step Setup Guide with exact instructions and direct developer links.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM HIGH-CONVERTING CTA BANNER */}
        <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="relative rounded-3xl bg-gradient-to-r from-accent-blue/20 via-purple-600/20 to-accent-blue/10 border border-white/15 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to 10x Your Automation Velocity?
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mb-8">
                Join forward-thinking companies running mission-critical marketing, messaging, and data pipelines on Automatix.
              </p>
              <Link href={ctaLink}>
                <button className="px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-white/90 hover:scale-105 transition-all shadow-xl active:scale-[0.98] cursor-pointer text-sm sm:text-base flex items-center gap-2">
                  <span>Get Started Now</span>
                  <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="w-full border-t border-border-subtle bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
