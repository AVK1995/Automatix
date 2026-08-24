'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  CreditCard, 
  Bell, 
  AlertTriangle, 
  History, 
  FileCode, 
  Eye, 
  Loader2, 
  CheckCircle2, 
  Users, 
  User, 
  RefreshCw, 
  ChevronDown, 
  Search,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATE_PRESETS = [
  {
    id: 'feature_update',
    name: '📢 Feature Release / System Announcement',
    category: 'ANNOUNCEMENT',
    subject: '🚀 Exciting New Features & Updates on Automatix!',
    body: `Hello {{USER_NAME}},

We're thrilled to announce powerful new updates to your Automatix workflow platform!

What's New:
• Enhanced Workflow Execution Engine with ultra-low response times.
• Expanded Storage Bucket Tiers with high-speed media delivery.
• Improved Meta & Instagram API format auto-detection.

Log into your dashboard today to explore these updates and boost your automated funnels.

Best regards,
The Automatix Team`
  },
  {
    id: 'billing_reminder',
    name: '💳 Billing Renewal & Payment Notice',
    category: 'BILLING',
    subject: '📅 Upcoming Renewal Notice for your Automatix Subscription',
    body: `Hello {{USER_NAME}},

This is a friendly reminder that your {{SUBSCRIPTION_TIER}} subscription and {{STORAGE_TIER}} storage plan are scheduled for renewal on {{EXPIRY_DATE}}.

Please ensure your payment details are up-to-date in your Billing & Invoices dashboard to prevent any interruption in your automated workflows or media delivery.

Visit your billing dashboard below to review your invoice history and plan details.

Thank you for automating with Automatix!`
  },
  {
    id: 'grace_warning',
    name: '⚠️ Payment Overdue — 5-Day Storage Grace Warning',
    category: 'BILLING',
    subject: '⚠️ Urgent: Payment Overdue — 5-Day Storage Grace Period Active',
    body: `Hello {{USER_NAME}},

Your subscription renewal payment for Automatix is currently overdue.

Your account has entered a 5-day grace period. If payment is not completed within 5 days, your storage will be downgraded to the base tier and excess media files will be permanently purged.

Please visit your Billing & Invoices dashboard immediately to complete your payment and safeguard your media files and active funnels.`
  },
  {
    id: 'legal_warning',
    name: '⚖️ Suspicious Activity / Meta Policy Warning',
    category: 'LEGAL',
    subject: '⚠️ Important Notice: Automated Activity & Policy Review',
    body: `Hello {{USER_NAME}},

Our automated monitoring systems have detected unusual activity or high messaging failure rates associated with your connected integrations on {{USER_EMAIL}}.

To maintain platform health and prevent suspension by third-party providers (such as Meta / Instagram Graph API), please review your active workflows and ensure all messaging strictly complies with Meta Business Messaging Policies.

If you have questions regarding this notice, reply directly to this email or contact support.`
  },
  {
    id: 'account_suspension',
    name: '🔒 Account Suspension / Terms Violation Warning',
    category: 'LEGAL',
    subject: '🚨 Official Notice: Terms of Service Violation Warning',
    body: `Hello {{USER_NAME}},

This is an official administrative notice regarding your Automatix account registered under {{USER_EMAIL}}.

Your recent account activity has been flagged for violating our Acceptable Use Policy. Please cease any unauthorized automation or spam behavior immediately.

Failure to resolve this within 24 hours will result in the immediate and permanent termination of your account and API connections.`
  },
  {
    id: 'maintenance',
    name: '🛠️ Scheduled Maintenance Announcement',
    category: 'SYSTEM',
    subject: '🛠️ Scheduled Maintenance Window Notice - Automatix',
    body: `Hello {{USER_NAME}},

We will be conducting scheduled infrastructure upgrades on our database and workflow execution servers to improve speed and reliability.

Maintenance Schedule:
• Expected Duration: ~30 minutes
• Workflows will queue safely during the window and resume execution immediately after.

No action is required on your end. Thank you for your patience!`
  }
];

export default function AdminCommunicationsHub() {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'logs' | 'templates'

  // Form State
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'PAID' | 'FREE' | 'GRACE' | 'SINGLE'
  const [recipientEmail, setRecipientEmail] = useState('');
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState(['email', 'notification']);
  const [showPreview, setShowPreview] = useState(false);

  // Audience Dropdown UI
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // AI Assist State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // Dispatch & Logs State
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/emails/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setCategory(preset.category);
    setSubject(preset.subject);
    setBody(preset.body);
    toast.success(`Loaded "${preset.name}" template`);
  };

  const handleInsertToken = (token) => {
    setBody(prev => prev + ` ${token} `);
  };

  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) return toast.error('Please describe what you want to announce.');
    setIsDrafting(true);
    try {
      const res = await fetch('/api/admin/notifications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft');
      setSubject(data.subject);
      setBody(data.body);
      toast.success('AI draft generated successfully!');
      setAiPrompt('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return toast.error('Subject and message body cannot be empty.');
    if (targetType === 'SINGLE' && !recipientEmail.trim()) return toast.error('Please enter the recipient email.');
    if (channels.length === 0) return toast.error('Please select at least one delivery channel (Email or In-App Notification).');

    const confirmMsg = targetType === 'SINGLE' 
      ? `Send this official communication to ${recipientEmail}?`
      : `Broadcast this message to ${targetType} users across the platform?`;

    if (!confirm(confirmMsg)) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          recipientEmail: targetType === 'SINGLE' ? recipientEmail.trim() : null,
          category,
          subject,
          body,
          channels
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');

      toast.success(`Successfully sent to ${data.sentCount} recipients!`);
      setSubject('');
      setBody('');
      setRecipientEmail('');
      if (activeTab === 'logs') fetchLogs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const targetOptions = [
    { value: 'ALL', label: '👥 All Registered Tenants' },
    { value: 'PAID', label: '⭐ Active Paid Subscribers (Pro / Enterprise)' },
    { value: 'FREE', label: '🌱 Free Starter Users' },
    { value: 'GRACE', label: '⚠️ Overdue / Grace Period Users' },
    { value: 'SINGLE', label: '🎯 Specific Tenant / User (Direct)' }
  ];

  const categoryOptions = [
    { value: 'ANNOUNCEMENT', label: '📢 General Announcement' },
    { value: 'BILLING', label: '💳 Billing & Renewal' },
    { value: 'LEGAL', label: '⚖️ Legal Warning & Policy' },
    { value: 'SYSTEM', label: '🛠️ System & Maintenance' },
    { value: 'DIRECT', label: '✉️ Direct Message' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Communications Hub</h1>
          <p className="text-sm text-text-secondary mt-1">
            Dispatch announcements, billing alerts, system updates, and legal notices with dynamic user tokens.
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative top-px ${
            activeTab === 'compose'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Mail size={15} />
          Compose & Broadcast
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative top-px ${
            activeTab === 'logs'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <History size={15} />
          Delivery History Logs
        </button>
      </div>

      {/* TAB 1: COMPOSE & BROADCAST */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          {/* Quick Preset Cards Bar */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-accent-blue" />
              1-Click Preset Templates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {TEMPLATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent-blue/30 text-left transition-all group"
                >
                  <span className="text-xs font-medium text-white group-hover:text-accent-blue block truncate">
                    {preset.name.split(' ')[0]} {preset.name.split(' ').slice(1).join(' ')}
                  </span>
                  <span className="text-[10px] text-text-tertiary block mt-1 uppercase">
                    {preset.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Drafting Assistant Card */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-accent-blue" />
                Draft with Gemini AI
              </h3>
              <span className="text-[11px] text-text-tertiary">Generates tailored announcement drafts</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Announce our new 5-day grace period storage protection and billing hub..."
                className="flex-1 bg-black/50 border border-border-subtle rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              />
              <button
                onClick={handleAiDraft}
                disabled={isDrafting}
                className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate Draft
              </button>
            </div>
          </div>

          {/* Main Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Email Composition */}
            <div className="lg:col-span-2 bg-[#111] border border-border-subtle rounded-xl p-6 space-y-5">
              {/* Audience & Category Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Audience Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Target Audience</label>
                  <button
                    type="button"
                    onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <span>{targetOptions.find(o => o.value === targetType)?.label}</span>
                    <ChevronDown size={14} className="text-text-tertiary" />
                  </button>
                  {isAudienceOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 py-1 overflow-hidden">
                      {targetOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setTargetType(opt.value); setIsAudienceOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs transition-colors hover:bg-white/10 ${
                            targetType === opt.value ? 'text-accent-blue font-semibold bg-accent-blue/5' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Notice Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white flex items-center justify-between hover:border-white/20 transition-colors"
                  >
                    <span>{categoryOptions.find(o => o.value === category)?.label}</span>
                    <ChevronDown size={14} className="text-text-tertiary" />
                  </button>
                  {isCategoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 py-1 overflow-hidden">
                      {categoryOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setCategory(opt.value); setIsCategoryOpen(false); }}
                          className={`w-full text-left px-3.5 py-2 text-xs transition-colors hover:bg-white/10 ${
                            category === opt.value ? 'text-accent-blue font-semibold bg-accent-blue/5' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Single User Recipient Input */}
              {targetType === 'SINGLE' && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Recipient User Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. client@domain.com"
                      className="w-full bg-black/50 border border-accent-blue/40 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent-blue pl-9"
                    />
                    <User size={15} className="absolute left-3 top-2.5 text-accent-blue" />
                  </div>
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 📢 Important Update: New Funnel Capabilities"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-accent-blue"
                />
              </div>

              {/* Personalized Dynamic Tokens Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-text-secondary">Insert Personalization Tokens (Click to insert):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: '{{USER_NAME}}', label: 'User Name' },
                    { token: '{{USER_EMAIL}}', label: 'Email' },
                    { token: '{{SUBSCRIPTION_TIER}}', label: 'Plan Tier' },
                    { token: '{{STORAGE_TIER}}', label: 'Storage Tier' },
                    { token: '{{EXPIRY_DATE}}', label: 'Renewal Date' },
                  ].map((t) => (
                    <button
                      key={t.token}
                      type="button"
                      onClick={() => handleInsertToken(t.token)}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-accent-blue/10 border border-white/10 hover:border-accent-blue/30 text-[11px] text-text-secondary hover:text-accent-blue font-mono transition-colors"
                    >
                      {t.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-text-secondary">Message Content</label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                  >
                    <Eye size={13} />
                    {showPreview ? 'Switch to Editor' : 'Live Email Preview'}
                  </button>
                </div>

                {showPreview ? (
                  <div className="w-full bg-black/80 border border-white/10 rounded-lg p-4 min-h-[220px] text-xs text-text-secondary leading-relaxed space-y-2">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block border-b border-white/5 pb-1">
                      Rendered Preview for Recipient:
                    </span>
                    <p className="text-sm font-bold text-white mb-2">{subject || 'No Subject'}</p>
                    {body.split('\n').map((line, idx) => (
                      <p key={idx}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email body here..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue resize-none placeholder:text-text-tertiary"
                  />
                )}
              </div>

              {/* Delivery Channels */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-text-tertiary">Send Channels:</span>
                  <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input
                      type="checkbox"
                      checked={channels.includes('email')}
                      onChange={(e) => {
                        if (e.target.checked) setChannels([...channels, 'email']);
                        else setChannels(channels.filter(c => c !== 'email'));
                      }}
                      className="rounded bg-black border-white/20 text-accent-blue focus:ring-0 shrink-0"
                    />
                    <span>Email (SMTP)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input
                      type="checkbox"
                      checked={channels.includes('notification')}
                      onChange={(e) => {
                        if (e.target.checked) setChannels([...channels, 'notification']);
                        else setChannels(channels.filter(c => c !== 'notification'));
                      }}
                      className="rounded bg-black border-white/20 text-accent-blue focus:ring-0 shrink-0"
                    />
                    <span>In-App Notification</span>
                  </label>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-lg shadow-accent-blue/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Dispatch Communication
                </button>
              </div>
            </div>

            {/* Right Column: Audience & Guidance Card */}
            <div className="space-y-4">
              <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-4 text-xs">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users size={16} className="text-accent-blue" />
                  Targeting Overview
                </h3>

                <div className="space-y-2.5 text-text-secondary leading-relaxed">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <span className="font-medium text-white block mb-0.5">Audience Scope</span>
                    {targetType === 'ALL' && 'Sending to all registered tenants on the platform.'}
                    {targetType === 'PAID' && 'Targeting active Professional and Enterprise subscribers only.'}
                    {targetType === 'FREE' && 'Targeting free Starter tier users (useful for upgrade promotions).'}
                    {targetType === 'GRACE' && 'Targeting users whose storage or subscription is currently in the 5-day grace period.'}
                    {targetType === 'SINGLE' && 'Direct 1-on-1 official email to a specific user.'}
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <span className="font-medium text-white block mb-0.5">Dynamic Token Support</span>
                    Tokens are resolved per recipient. E.g. <code className="text-accent-blue">{'{{USER_NAME}}'}</code> is replaced by the client's registered name automatically.
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <span className="font-medium text-white block mb-0.5">Delivery Delivery Safety</span>
                    Emails are sent with high deliverability via your configured SMTP credentials with zero external tracking pixels.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERY LOGS & HISTORY */}
      {activeTab === 'logs' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <History size={18} className="text-accent-blue" />
                Communication Logs & Sent History
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Audit trail of all broadcast emails, legal notices, and billing alerts dispatched by admins.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-accent-blue" /></div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-xl">
              <Mail size={32} className="text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">No communications have been dispatched yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle uppercase text-[10px] text-text-secondary font-semibold">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Target Group</th>
                    <th className="py-3 px-4">Recipients</th>
                    <th className="py-3 px-4">Sent By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-text-tertiary">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.category === 'LEGAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          log.category === 'BILLING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          log.category === 'SYSTEM' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {log.targetType === 'SINGLE' ? log.recipientEmail : `${log.targetType} Users`}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">
                        {log.sentCount} delivered
                      </td>
                      <td className="py-3.5 px-4 text-text-tertiary">
                        {log.sentBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
