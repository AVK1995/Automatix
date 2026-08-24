'use client';

import { useState, useEffect, useRef } from 'react';
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
  X,
  Star,
  UserCheck,
  Megaphone,
  Wrench,
  Lock,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATE_PRESETS = [
  {
    id: 'feature_update',
    name: 'Feature Release & System Updates',
    category: 'ANNOUNCEMENT',
    icon: Sparkles,
    subject: 'Important System Updates & New Features on Automatix',
    body: `<p>Hello {{USER_NAME}},</p>
<p>We are pleased to introduce new workflow and performance enhancements to the Automatix platform.</p>
<h3>Key Enhancements:</h3>
<ul>
  <li><strong>Optimized Engine:</strong> Real-time event execution with zero cold-start delay.</li>
  <li><strong>Storage Quotas:</strong> Dedicated storage bucket capacity with high-speed media delivery.</li>
  <li><strong>Integration Health:</strong> Improved Meta Graph API token verification.</li>
</ul>
<p>You can access these features directly from your client dashboard today.</p>`
  },
  {
    id: 'billing_reminder',
    name: 'Billing Renewal & Payment Notice',
    category: 'BILLING',
    icon: CreditCard,
    subject: 'Upcoming Renewal Notice for your Automatix Subscription',
    body: `<p>Hello {{USER_NAME}},</p>
<p>This is an automated notification regarding your {{SUBSCRIPTION_TIER}} subscription and {{STORAGE_TIER}} storage tier.</p>
<p>Your scheduled renewal date is <strong>{{EXPIRY_DATE}}</strong>.</p>
<p>Please ensure your payment preferences or AutoPay settings are verified in your Billing & Invoices dashboard to ensure uninterrupted automation services.</p>`
  },
  {
    id: 'grace_warning',
    name: '5-Day Storage Grace Warning',
    category: 'BILLING',
    icon: AlertTriangle,
    subject: 'Urgent: Payment Overdue - 5-Day Storage Grace Period Active',
    body: `<p>Hello {{USER_NAME}},</p>
<p>Your subscription renewal payment for Automatix is currently overdue.</p>
<p>Your storage allocation has entered a <strong>5-day grace period</strong>. If payment is not completed within 5 days, your account will revert to the base tier and excess media files will be permanently purged.</p>
<p>Please visit your Billing & Invoices dashboard immediately to complete payment and protect your media assets.</p>`
  },
  {
    id: 'legal_warning',
    name: 'Meta Policy & Security Notice',
    category: 'LEGAL',
    icon: ShieldAlert,
    subject: 'Important Notice: Automated Messaging Activity Review',
    body: `<p>Hello {{USER_NAME}},</p>
<p>Our security monitors have detected abnormal messaging rates or higher than standard error responses on your connected account: <strong>{{USER_EMAIL}}</strong>.</p>
<p>To ensure continuous compliance with Meta Business Messaging and Instagram Graph API policies, please review your active funnel flows and rate limits.</p>
<p>If you require technical assistance, please reply directly to this notice or reach out to support.</p>`
  },
  {
    id: 'account_suspension',
    name: 'Terms Violation Warning',
    category: 'LEGAL',
    icon: Lock,
    subject: 'Official Administrative Notice: Terms of Service Violation Warning',
    body: `<p>Hello {{USER_NAME}},</p>
<p>This is an official administrative notice regarding your account registered under <strong>{{USER_EMAIL}}</strong>.</p>
<p>Recent automated behavior associated with your account has been flagged for non-compliance with our Acceptable Use Guidelines. Please halt any unauthorized messaging activity immediately.</p>
<p>Failure to rectify this within 24 hours may result in account restriction or connection suspension.</p>`
  },
  {
    id: 'maintenance',
    name: 'Scheduled Maintenance Notice',
    category: 'SYSTEM',
    icon: Wrench,
    subject: 'Notice of Scheduled System Maintenance Window',
    body: `<p>Hello {{USER_NAME}},</p>
<p>We will be performing scheduled infrastructure maintenance on our database cluster and execution servers.</p>
<p><strong>Window Details:</strong></p>
<ul>
  <li>Expected Duration: Approximately 30 minutes</li>
  <li>Workflow executions will queue securely during the maintenance window and process immediately upon completion.</li>
</ul>
<p>Thank you for your cooperation as we improve platform speed and resilience.</p>`
  }
];

export default function AdminCommunicationsHub() {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'logs'

  // Form State
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'PAID' | 'FREE' | 'GRACE' | 'SINGLE'
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState(['email', 'notification']);
  const [showPreview, setShowPreview] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(true);

  // Audience Dropdown UI
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // User Search State for Single Recipient
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSearchRef = useRef(null);

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

  // Handle outside click for user search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users by Name or Email
  useEffect(() => {
    if (targetType !== 'SINGLE') return;
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setIsUserDropdownOpen(true);
        }
      } catch (e) {
        console.error('Failed to search tenants:', e);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, targetType]);

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
    setBody(prev => prev + `${token}`);
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
      setIsHtmlMode(true);
      toast.success('AI draft generated successfully (HTML format, zero emojis)!');
      setAiPrompt('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setRecipientEmail(user.email);
    setSearchQuery(`${user.name || 'User'} (${user.email})`);
    setIsUserDropdownOpen(false);
  };

  const handleClearSelectedUser = () => {
    setSelectedUser(null);
    setRecipientEmail('');
    setSearchQuery('');
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return toast.error('Subject and message body cannot be empty.');
    if (targetType === 'SINGLE' && !recipientEmail.trim()) return toast.error('Please select a recipient tenant.');
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
      handleClearSelectedUser();
      if (activeTab === 'logs') fetchLogs();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const targetOptions = [
    { value: 'ALL', label: 'All Registered Tenants', icon: Users },
    { value: 'PAID', label: 'Active Paid Subscribers (Pro / Enterprise)', icon: Star },
    { value: 'FREE', label: 'Free Starter Users', icon: UserCheck },
    { value: 'GRACE', label: 'Overdue / Grace Period Users', icon: AlertTriangle },
    { value: 'SINGLE', label: 'Specific Tenant / User (Direct)', icon: User }
  ];

  const categoryOptions = [
    { value: 'ANNOUNCEMENT', label: 'General Announcement', icon: Megaphone },
    { value: 'BILLING', label: 'Billing & Renewal', icon: CreditCard },
    { value: 'LEGAL', label: 'Legal Warning & Policy', icon: ShieldAlert },
    { value: 'SYSTEM', label: 'System & Maintenance', icon: Wrench },
    { value: 'DIRECT', label: 'Direct Message', icon: Mail }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Communications Hub</h1>
          <p className="text-sm text-text-secondary mt-1">
            Dispatch announcements, billing alerts, system updates, and compliance notices with clean themed HTML.
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
          {/* Quick Preset Cards Bar (Clean Themed Icons, No Raw Emojis) */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-accent-blue" />
              1-Click Preset Templates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {TEMPLATE_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-accent-blue/30 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-accent-blue mb-1.5">
                        <IconComponent size={14} />
                      </div>
                      <span className="text-xs font-medium text-white group-hover:text-accent-blue block line-clamp-2">
                        {preset.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary block mt-2 uppercase tracking-wider font-semibold">
                      {preset.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Drafting Assistant Card */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-accent-blue" />
                Draft with Gemini AI (Dark-Themed HTML, No Emojis)
              </h3>
              <span className="text-[11px] text-text-tertiary">Generates executive styled HTML drafts</span>
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
                    <div className="flex items-center gap-2 truncate">
                      {(() => {
                        const opt = targetOptions.find(o => o.value === targetType);
                        if (!opt) return null;
                        const Icon = opt.icon;
                        return (
                          <>
                            <Icon size={14} className="text-accent-blue shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown size={14} className="text-text-tertiary shrink-0 ml-1" />
                  </button>
                  {isAudienceOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 py-1 overflow-hidden">
                      {targetOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setTargetType(opt.value); setIsAudienceOpen(false); }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-white/10 flex items-center gap-2.5 ${
                              targetType === opt.value ? 'text-accent-blue font-semibold bg-accent-blue/5' : 'text-white'
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
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
                    <div className="flex items-center gap-2 truncate">
                      {(() => {
                        const opt = categoryOptions.find(o => o.value === category);
                        if (!opt) return null;
                        const Icon = opt.icon;
                        return (
                          <>
                            <Icon size={14} className="text-accent-blue shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown size={14} className="text-text-tertiary shrink-0 ml-1" />
                  </button>
                  {isCategoryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 py-1 overflow-hidden">
                      {categoryOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setCategory(opt.value); setIsCategoryOpen(false); }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-white/10 flex items-center gap-2.5 ${
                              category === opt.value ? 'text-accent-blue font-semibold bg-accent-blue/5' : 'text-white'
                            }`}
                          >
                            <Icon size={14} className="shrink-0" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Tenant Searchable Dropdown (Image 3 Fix) */}
              {targetType === 'SINGLE' && (
                <div className="relative" ref={userSearchRef}>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Search & Select Recipient Tenant (by Name or Email)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isUserDropdownOpen) setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setIsUserDropdownOpen(true);
                      }}
                      placeholder="Type client name or email address to search..."
                      className="w-full bg-black/50 border border-accent-blue/40 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue pl-9 pr-8"
                    />
                    <Search size={15} className="absolute left-3 top-3 text-accent-blue" />
                    {isSearchingUsers && (
                      <Loader2 size={15} className="absolute right-3 top-3 text-text-tertiary animate-spin" />
                    )}
                    {selectedUser && !isSearchingUsers && (
                      <button
                        type="button"
                        onClick={handleClearSelectedUser}
                        className="absolute right-2.5 top-2.5 p-0.5 text-text-tertiary hover:text-white rounded"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Tenant Results Dropdown */}
                  {isUserDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-white/5">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-white group-hover:text-accent-blue truncate">
                              {u.name || 'Unnamed Client'}
                            </div>
                            <div className="text-[11px] text-text-secondary truncate">{u.email}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-text-secondary border border-white/10">
                              {u.subscriptionTier || 'Free'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.storageStatus === 'GRACE_PERIOD' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {u.storageStatus || 'Active'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important System Updates & Feature Release"
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

              {/* Body Content Editor with HTML & Preview Toggles */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-text-secondary">HTML Message Body</label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-mono">
                      Semantic HTML Supported
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs text-accent-blue hover:underline flex items-center gap-1.5"
                    >
                      <Eye size={13} />
                      {showPreview ? 'Switch to HTML Editor' : 'Live Inbox Preview'}
                    </button>
                  </div>
                </div>

                {showPreview ? (
                  <div className="w-full bg-[#0d0d0d] border border-white/15 rounded-lg p-5 min-h-[260px] text-xs text-[#d1d5db] leading-relaxed space-y-3">
                    <div className="border-b border-white/10 pb-2 mb-3">
                      <span className="text-[10px] text-text-tertiary uppercase tracking-wider block mb-1">Subject Header</span>
                      <h4 className="text-sm font-bold text-white">{subject || 'No Subject Defined'}</h4>
                    </div>
                    {/* Rendered Live HTML Preview */}
                    <div 
                      className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_strong]:text-white"
                      dangerouslySetInnerHTML={{ __html: body || '<p class="text-text-tertiary">No message content entered.</p>' }}
                    />
                  </div>
                ) : (
                  <textarea
                    rows={9}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter clean semantic HTML: <p>Hello {{USER_NAME}},</p> <h3>Section Title</h3> <ul><li>Feature 1</li></ul>..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-accent-blue resize-none placeholder:text-text-tertiary leading-relaxed"
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
                    {targetType === 'SINGLE' && (
                      selectedUser 
                        ? `Targeting: ${selectedUser.name || selectedUser.email} (${selectedUser.email})`
                        : 'Select a client tenant using the searchable dropdown.'
                    )}
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <span className="font-medium text-white block mb-0.5">Executive HTML Formatting</span>
                    Drafts generated by Gemini AI or entered manually will render natively inside our dark branded template with zero emojis.
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                    <span className="font-medium text-white block mb-0.5">Dynamic Token Support</span>
                    Tokens such as <code className="text-accent-blue">{'{{USER_NAME}}'}</code> and <code className="text-accent-blue">{'{{EXPIRY_DATE}}'}</code> are substituted individually per recipient before dispatch.
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
