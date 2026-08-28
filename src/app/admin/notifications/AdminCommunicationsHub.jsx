'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  Users,
  User,
  History as HistoryIcon,
  Eye,
  Code,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  UserCheck,
  Star,
  ShieldAlert,
  CreditCard,
  Megaphone,
  Wrench,
  ChevronDown,
  Loader2,
  Save,
  FileCode,
  Lock,
  X,
  Wand2,
  GitBranch,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Checkbox from '@/components/ui/Checkbox';
import { getPlatformSettings, updatePlatformSettings } from '@/actions/settings';
import AiRadahnModal from '@/components/admin/AiRadahnModal';

const TEMPLATE_PRESETS = [
  {
    id: 'feature_update',
    name: 'Feature Release & System Updates',
    category: 'ANNOUNCEMENT',
    icon: Sparkles,
    subject: 'Major Platform Updates: Multimodal AI Mediator, Cloud Storage Triggers & 60fps Engine',
    body: `<p>Hello {{USER_NAME}},</p>
<p>We are thrilled to announce a major platform upgrade on Automatix with brand new workflow automations, intelligent AI processing, and extreme performance enhancements.</p>

<h3>What's New Today:</h3>
<ul>
  <li><strong>Multimodal AI Mediator:</strong> Automatically detect and process <em>Videos (.mp4, .mov)</em>, <em>Audio (.mp3, .wav)</em>, <em>Images</em>, <em>Documents (.pdf, .docx)</em>, and <em>Spreadsheets (.csv)</em>. Generate viral captions, speech-to-text transcripts, executive summaries, meeting action items, and data insights with structured downstream variables.</li>
  <li><strong>Cloud Storage & Google Drive Automation:</strong> Connect cloud folders with single-slot auto-overwritten buffers, direct Google Drive Apps Script intake, and instant live test payloads.</li>
  <li><strong>16:9 HD Video Player:</strong> Stream automation media in native 16:9 aspect ratio with direct high-speed CDN playback on mobile, tablet, and desktop.</li>
  <li><strong>Live Generation Latency Stopwatch:</strong> Real-time countdown and stopwatch timer during AI generation with full performance benchmark calculators.</li>
  <li><strong>60fps Canvas & Tablet Overlay Drawers:</strong> Full-width edge-to-edge workflow canvas with hardware-accelerated pan/zoom gestures and responsive slide-out panels.</li>
</ul>

<p>All updates are live on your account now. Explore the new nodes and triggers directly in your workflow builder!</p>`
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
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'templates' | 'logs'

  // Form State
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'PAID' | 'FREE' | 'GRACE' | 'SINGLE'
  const [selectedUsers, setSelectedUsers] = useState([]); // Multiple user chips for SINGLE targetType
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState(['email', 'notification']);
  const [showPreview, setShowPreview] = useState(false);

  // Audience Dropdown UI
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // User Search State for Multiple Recipients
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSearchRef = useRef(null);
  const searchInputRef = useRef(null);

  // AI Radahn Modal State
  const [isAiRadahnOpen, setIsAiRadahnOpen] = useState(false);
  const [aiRadahnMode, setAiRadahnMode] = useState('ANNOUNCEMENTS'); // 'ANNOUNCEMENTS' | 'REFINE'

  // Dispatch & Logs State
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  // System Email Templates State
  const [resetEmailTemplate, setResetEmailTemplate] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Textarea Refs for Cursor-Aware Token Insertion
  const bodyTextareaRef = useRef(null);
  const resetTemplateTextareaRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'templates') {
      fetchPlatformSettings();
    }
  }, [activeTab]);

  const fetchPlatformSettings = async () => {
    setLoadingTemplate(true);
    try {
      const res = await getPlatformSettings();
      if (res.success && res.settings) {
        setResetEmailTemplate(res.settings.resetEmailTemplate || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await updatePlatformSettings({ resetEmailTemplate });
      if (!res.success) throw new Error(res.error || 'Failed to save template');
      toast.success('Password Reset Email template saved successfully');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingTemplate(false);
    }
  };

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
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setBody(prev => (prev ? prev + token : token));
      return;
    }

    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const newBody = body.substring(0, start) + token + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const handleInsertResetToken = (token) => {
    const textarea = resetTemplateTextareaRef.current;
    if (!textarea) {
      setResetEmailTemplate(prev => (prev ? prev + token : token));
      return;
    }

    const start = textarea.selectionStart ?? resetEmailTemplate.length;
    const end = textarea.selectionEnd ?? resetEmailTemplate.length;
    const newContent = resetEmailTemplate.substring(0, start) + token + resetEmailTemplate.substring(end);
    setResetEmailTemplate(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const handleAddUser = (user) => {
    if (!selectedUsers.some(u => u.id === user.id || u.email === user.email)) {
      setSelectedUsers(prev => [...prev, user]);
    }
    setSearchQuery('');
    setIsUserDropdownOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleClearAllUsers = () => {
    setSelectedUsers([]);
    setSearchQuery('');
  };

  const handleOpenAiRadahn = (initialMode = 'ANNOUNCEMENTS') => {
    setAiRadahnMode(initialMode);
    setIsAiRadahnOpen(true);
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return toast.error('Subject and message body cannot be empty.');
    if (targetType === 'SINGLE' && selectedUsers.length === 0) return toast.error('Please search and select at least one recipient tenant.');
    if (channels.length === 0) return toast.error('Please select at least one delivery channel (Email or In-App Notification).');

    const msg = targetType === 'SINGLE' 
      ? `Are you sure you want to dispatch this communication to ${selectedUsers.length} selected recipient(s)?`
      : `Are you sure you want to broadcast this message to all ${targetType} tier users across the platform?`;

    setConfirmMessage(msg);
    setIsConfirmModalOpen(true);
  };

  const executeSend = async () => {
    setIsConfirmModalOpen(false);
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          recipientEmails: targetType === 'SINGLE' ? selectedUsers.map(u => u.email) : null,
          category,
          subject,
          body,
          channels
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch communication');

      toast.success(`Successfully dispatched to ${data.sentCount} recipient(s)!`);
      setSubject('');
      setBody('');
      setSelectedUsers([]);
      setSearchQuery('');
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
    { value: 'SINGLE', label: 'Specific Tenants / Users (Multiple Search)', icon: User }
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

        {/* Global AI Radahn Studio Launcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenAiRadahn('ANNOUNCEMENTS')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            ✨ AI Radahn (Deployments Announcement)
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('compose')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'compose'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Mail size={15} />
          Compose & Broadcast
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'templates'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <FileCode size={15} />
          System Email Templates
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'logs'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <HistoryIcon size={15} />
          Delivery History Logs
        </button>
      </div>

      {/* TAB 1: COMPOSE & BROADCAST */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          
          {/* Quick Preset Cards Bar */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-accent-blue" />
                1-Click Preset Templates
              </h3>
              <button
                type="button"
                onClick={() => handleOpenAiRadahn('ANNOUNCEMENTS')}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <GitBranch size={13} />
                Generate from Recent Git Commits &rarr;
              </button>
            </div>
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

          {/* Main Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Email Composition */}
            <div className="lg:col-span-2 bg-[#111] border border-border-subtle rounded-xl p-4 sm:p-6 space-y-5">
              
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

              {/* Multiple Tenant Search & Gmail-Style Selection Chips (Image 2 Fix) */}
              {targetType === 'SINGLE' && (
                <div className="relative space-y-2" ref={userSearchRef}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-text-secondary">
                      Search & Select Recipient Tenants ({selectedUsers.length} Selected)
                    </label>
                    {selectedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllUsers}
                        className="text-[11px] text-text-tertiary hover:text-red-400 transition-colors"
                      >
                        Clear all recipients
                      </button>
                    )}
                  </div>

                  {/* Gmail-Style Selected Users Chips */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-white/10 rounded-lg max-h-36 overflow-y-auto custom-scrollbar">
                      {selectedUsers.map((u) => (
                        <span 
                          key={u.id || u.email}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-blue/15 border border-accent-blue/30 text-xs text-white shadow-sm"
                        >
                          <span className="w-4 h-4 rounded-full bg-accent-blue text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                            {(u.name || u.email)?.[0]?.toUpperCase() || 'U'}
                          </span>
                          <span className="font-medium max-w-[150px] truncate">{u.name || u.email}</span>
                          <span className="text-[10px] text-text-tertiary max-w-[120px] truncate">({u.email})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-0.5 text-text-tertiary hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isUserDropdownOpen) setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setIsUserDropdownOpen(true);
                      }}
                      placeholder="Type client name or email address to search and add..."
                      className="w-full bg-black/50 border border-accent-blue/40 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue pl-9 pr-8"
                    />
                    <Search size={15} className="absolute left-3 top-3 text-accent-blue" />
                    {isSearchingUsers && (
                      <Loader2 size={15} className="absolute right-3 top-3 text-text-tertiary animate-spin" />
                    )}
                  </div>

                  {/* Tenant Results Dropdown */}
                  {isUserDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/15 rounded-lg shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                      {searchResults.map((u) => {
                        const isAlreadySelected = selectedUsers.some(sel => sel.id === u.id || sel.email === u.email);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleAddUser(u)}
                            className={`w-full text-left p-3 hover:bg-white/10 transition-colors flex items-center justify-between gap-3 group ${
                              isAlreadySelected ? 'bg-accent-blue/5 opacity-60' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-white group-hover:text-accent-blue truncate flex items-center gap-1.5">
                                <span>{u.name || 'Unnamed Client'}</span>
                                {isAlreadySelected && (
                                  <span className="text-[10px] text-accent-blue font-bold">(Added)</span>
                                )}
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
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subject Input with In-Line AI Radahn Refine Button (Image 3) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Email Subject</label>
                  <button
                    type="button"
                    onClick={() => handleOpenAiRadahn('REFINE')}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer"
                  >
                    <Wand2 size={12} />
                    ✨ AI Radahn Refine
                  </button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important System Updates & Feature Release"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-accent-blue"
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

              {/* Body Content Editor with In-Line AI Radahn Refine Button (Image 3) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <label className="text-xs font-medium text-text-secondary">HTML Message Body</label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-mono">
                      Semantic HTML Supported
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAiRadahn('REFINE')}
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer"
                    >
                      <Wand2 size={12} />
                      ✨ AI Radahn Refine
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs text-accent-blue hover:underline flex items-center gap-1.5 cursor-pointer"
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
                      className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_strong]:text-white [&_em]:text-accent-blue [&_em]:not-italic"
                      dangerouslySetInnerHTML={{ __html: body || '<p class="text-text-tertiary">No message content entered.</p>' }}
                    />
                  </div>
                ) : (
                  <textarea
                    ref={bodyTextareaRef}
                    rows={9}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter clean semantic HTML: <p>Hello {{USER_NAME}},</p> <h3>Section Title</h3> <ul><li>Feature 1</li></ul>..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-accent-blue resize-none placeholder:text-text-tertiary leading-relaxed"
                  />
                )}
              </div>

              {/* Delivery Channels & Dispatch Action */}
              <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <span className="text-text-tertiary">Send Channels:</span>
                  <Checkbox
                    checked={channels.includes('email')}
                    onChange={(checked) => {
                      if (checked) setChannels(prev => [...prev, 'email']);
                      else setChannels(prev => prev.filter(c => c !== 'email'));
                    }}
                    label="Email (SMTP)"
                  />
                  <Checkbox
                    checked={channels.includes('notification')}
                    onChange={(checked) => {
                      if (checked) setChannels(prev => [...prev, 'notification']);
                      else setChannels(prev => prev.filter(c => c !== 'notification'));
                    }}
                    label="In-App Notification"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSending ? (
                    <><Loader2 size={15} className="animate-spin" /> Dispatching...</>
                  ) : (
                    <><Send size={15} /> Dispatch Communication</>
                  )}
                </button>
              </div>

            </div>

            {/* Right 1 Col: Live Info / Summary Card */}
            <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Megaphone size={16} className="text-accent-blue" />
                  Broadcast Summary
                </h3>

                <div className="space-y-3 text-xs text-text-secondary">
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">Audience Target</span>
                    <span className="text-white font-medium">
                      {targetType === 'SINGLE' 
                        ? `${selectedUsers.length} Specific Tenant(s)` 
                        : targetOptions.find(o => o.value === targetType)?.label}
                    </span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">Category Tag</span>
                    <span className="text-accent-blue font-medium capitalize">{category.toLowerCase()}</span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">Active Channels</span>
                    <span className="text-white font-medium capitalize">{channels.join(', ') || 'None selected'}</span>
                  </div>
                </div>
              </div>

              {/* AI Radahn Banner Card */}
              <div className="p-4 bg-gradient-to-br from-purple-950/40 via-blue-950/20 to-black rounded-xl border border-purple-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>AI Radahn Engine</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Need a full release announcement for new commits or want to tweak your subject and copy? Use AI Radahn anytime.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAiRadahn('ANNOUNCEMENTS')}
                  className="w-full py-2 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <GitBranch size={13} /> Launch AI Radahn Studio
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SYSTEM EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-[#111] border border-border-subtle rounded-xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <FileCode size={18} className="text-accent-blue" />
                  Password Reset & Setup Transactional Template
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Customize the exact HTML email dispatched when an admin clicks "Send Reset Link" on any user profile.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Template
              </button>
            </div>

            {loadingTemplate ? (
              <div className="py-16 flex flex-col items-center justify-center text-text-tertiary gap-2">
                <Loader2 size={24} className="animate-spin text-accent-blue" />
                <span className="text-xs">Loading template settings...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Insert Tokens:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertResetToken('{{SETUP_LINK}}')}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-accent-blue/10 border border-white/10 hover:border-accent-blue/30 text-[11px] text-text-secondary hover:text-accent-blue font-mono transition-colors"
                  >
                    {'{{SETUP_LINK}}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertResetToken('{{USER_EMAIL}}')}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-accent-blue/10 border border-white/10 hover:border-accent-blue/30 text-[11px] text-text-secondary hover:text-accent-blue font-mono transition-colors"
                  >
                    {'{{USER_EMAIL}}'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Raw HTML Code Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-white">Custom HTML Template</span>
                      <span className="text-[11px] text-text-tertiary">Semantic Email HTML</span>
                    </div>
                    <textarea
                      ref={resetTemplateTextareaRef}
                      value={resetEmailTemplate}
                      onChange={(e) => setResetEmailTemplate(e.target.value)}
                      rows={16}
                      placeholder="<!DOCTYPE html><html>...Use {{SETUP_LINK}} and {{USER_EMAIL}}...</html>"
                      className="w-full bg-black/60 border border-border-subtle rounded-xl p-4 text-xs font-mono text-white focus:outline-none focus:border-accent-blue resize-none leading-relaxed"
                    />
                  </div>

                  {/* Live Rendered View */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-white">Live Email Preview</span>
                      <span className="text-[11px] text-emerald-400 font-medium">Rendered HTML View</span>
                    </div>
                    <div className="w-full h-[340px] bg-[#050505] border border-border-subtle rounded-xl p-4 overflow-y-auto custom-scrollbar">
                      {resetEmailTemplate ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: resetEmailTemplate
                              .replace(/\{\{SETUP_LINK\}\}/g, 'https://automatix.ai/setup-password?token=example_secure_token')
                              .replace(/\{\{USER_EMAIL\}\}/g, 'user@example.com')
                          }}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-text-tertiary text-xs">
                          <Code size={24} className="mb-2 opacity-50" />
                          <p>No custom template set. The system default dark transactional template will be used.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <HistoryIcon size={18} className="text-accent-blue" />
                Delivery History Logs
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">Audit trail of all dispatched announcements and emails.</p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-1.5 text-xs"
            >
              <RefreshCw size={13} className={loadingLogs ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-16 flex flex-col items-center justify-center text-text-tertiary gap-2">
              <Loader2 size={24} className="animate-spin text-accent-blue" />
              <span className="text-xs">Fetching delivery logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-text-secondary text-xs">
              No delivery logs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5 overflow-x-auto">
              {logs.map((log) => (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-[300px]">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shrink-0">
                        {log.category}
                      </span>
                      <span className="font-semibold text-xs text-white truncate max-w-md">
                        {log.subject}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary flex items-center gap-3">
                      <span>Target: <strong className="text-white">{log.targetType}</strong></span>
                      {log.recipientEmail && (
                        <span>To: <strong className="text-white">{log.recipientEmail}</strong></span>
                      )}
                      <span>Recipients: <strong className="text-white">{log.sentCount}</strong></span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-text-tertiary shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSend}
        title="Confirm Dispatch"
        message={confirmMessage}
        confirmText="Dispatch Now"
        isDestructive={false}
      />

      {/* AI Radahn Feature Announcement & In-Line Refinement Modal */}
      <AiRadahnModal
        isOpen={isAiRadahnOpen}
        onClose={() => setIsAiRadahnOpen(false)}
        initialMode={aiRadahnMode}
        currentSubject={subject}
        currentBody={body}
        onApply={(output) => {
          if (output.subject) setSubject(output.subject);
          if (output.body) setBody(output.body);
          setShowPreview(true);
        }}
      />

    </div>
  );
}
