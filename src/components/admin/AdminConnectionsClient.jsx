'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Mail, 
  Calendar, 
  Camera, 
  Smartphone, 
  Users, 
  MessageSquare, 
  Globe, 
  Link as LinkIcon, 
  Search, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  SlidersHorizontal,
  Plus,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import { exportToCsv } from '@/lib/csvExport';
import TruncatedText from '@/components/ui/TruncatedText';

const APP_CATALOG = [
  // 1. Social & Messaging
  {
    id: 'INSTAGRAM',
    providerKey: 'INSTAGRAM',
    aliases: ['instagram', 'insta'],
    name: 'Instagram',
    category: 'SOCIAL',
    categoryLabel: 'Social & Messaging',
    icon: Camera,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    tag: 'POPULAR',
    description: 'Auto-publish reels, feed posts, carousel drops, and direct message webhooks.'
  },
  {
    id: 'WHATSAPP',
    providerKey: 'WHATSAPP',
    aliases: ['whatsapp', 'wa'],
    name: 'WhatsApp Business',
    category: 'SOCIAL',
    categoryLabel: 'Social & Messaging',
    icon: Smartphone,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    tag: 'LIVE',
    description: 'Trigger WhatsApp template notifications, auto-replies, and customer broadcasts.'
  },
  {
    id: 'FACEBOOK',
    providerKey: 'FACEBOOK',
    aliases: ['facebook', 'meta', 'fb'],
    name: 'Facebook Pages & Leads',
    category: 'SOCIAL',
    categoryLabel: 'Social & Messaging',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    tag: 'VERIFIED',
    description: 'Capture Lead Ads instant events, page wall posts, and community webhook feeds.'
  },
  {
    id: 'SLACK',
    providerKey: 'SLACK',
    aliases: ['slack'],
    name: 'Slack Bot & Channels',
    category: 'SOCIAL',
    categoryLabel: 'Social & Messaging',
    icon: MessageSquare,
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    tag: 'WORKSPACE',
    description: 'Post automated execution alerts, channel messages, and team notifications.'
  },

  // 2. Data & Spreadsheets
  {
    id: 'GOOGLE_SHEETS',
    providerKey: 'GOOGLE_SHEETS',
    aliases: ['google_sheets', 'sheets', 'googlesheets'],
    name: 'Google Sheets',
    category: 'DATA',
    categoryLabel: 'Data & Cloud Storage',
    icon: Database,
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    tag: 'CORE ENGINE',
    description: 'Realtime row triggers, append lead rows, sync tables, and batch spreadsheet updates.'
  },
  {
    id: 'GOOGLE_DRIVE',
    providerKey: 'GOOGLE_DRIVE',
    aliases: ['google_drive', 'gdrive', 'drive'],
    name: 'Google Drive / Storage',
    category: 'DATA',
    categoryLabel: 'Data & Cloud Storage',
    icon: Database,
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    tag: 'TRIGGER SYNC',
    description: 'Poll and capture new video/image uploads from target tenant Drive folders.'
  },
  {
    id: 'NOTION',
    providerKey: 'NOTION',
    aliases: ['notion'],
    name: 'Notion Database',
    category: 'DATA',
    categoryLabel: 'Data & Cloud Storage',
    icon: Database,
    color: 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20',
    tag: 'WORKSPACE',
    description: 'Query database pages, append task blocks, and sync team workspace records.'
  },

  // 3. Email & Communications
  {
    id: 'SMTP',
    providerKey: 'SMTP',
    aliases: ['smtp', 'custom_smtp', 'mail'],
    name: 'Custom SMTP Server',
    category: 'EMAIL',
    categoryLabel: 'Email & Communications',
    icon: Mail,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    tag: 'TRANSACTIONAL',
    description: 'Direct authenticated SMTP dispatch with custom TLS/SSL ports and custom headers.'
  },
  {
    id: 'GMAIL',
    providerKey: 'GMAIL',
    aliases: ['gmail', 'google_mail'],
    name: 'Google Workspace Gmail',
    category: 'EMAIL',
    categoryLabel: 'Email & Communications',
    icon: Mail,
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    tag: 'OAUTH2',
    description: 'Send emails through OAuth2 verified tenant Gmail and Google Workspace accounts.'
  },

  // 4. Calendars & Scheduling
  {
    id: 'AUTOMATIX_CALENDAR',
    providerKey: 'AUTOMATIX_CALENDAR',
    aliases: ['automatix_calendar', 'calendar', 'internal_calendar'],
    name: 'Automatix Native Calendar',
    category: 'CALENDAR',
    categoryLabel: 'Calendars & Scheduling',
    icon: Calendar,
    color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/30',
    tag: 'BUILT-IN',
    description: 'Native booking engine, appointment slots, customer reminders, and scheduling webhooks.'
  },
  {
    id: 'CALENDLY',
    providerKey: 'CALENDLY',
    aliases: ['calendly'],
    name: 'Calendly',
    category: 'CALENDAR',
    categoryLabel: 'Calendars & Scheduling',
    icon: Calendar,
    color: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    tag: 'BOOKINGS',
    description: 'Listen to invitee.created and invitee.canceled booking webhooks in real-time.'
  },
  {
    id: 'CAL_COM',
    providerKey: 'CAL_COM',
    aliases: ['cal_com', 'cal.com'],
    name: 'Cal.com',
    category: 'CALENDAR',
    categoryLabel: 'Calendars & Scheduling',
    icon: Calendar,
    color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    tag: 'OPEN CORE',
    description: 'Capture open scheduling events, custom booking questions, and reschedule triggers.'
  },

  // 5. Developer & Webhooks
  {
    id: 'WEBHOOK',
    providerKey: 'WEBHOOK',
    aliases: ['webhook', 'api', 'custom_webhook', 'rest_api'],
    name: 'Custom Webhook / REST API',
    category: 'DEVELOPER',
    categoryLabel: 'Developer & Webhooks',
    icon: Globe,
    color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    tag: 'ANY ENDPOINT',
    description: 'Inbound POST/GET webhook listeners and custom HTTP request outbound actions.'
  },
  {
    id: 'STRIPE',
    providerKey: 'STRIPE',
    aliases: ['stripe'],
    name: 'Stripe Billing & Webhooks',
    category: 'DEVELOPER',
    categoryLabel: 'Developer & Webhooks',
    icon: Globe,
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    tag: 'PAYMENTS',
    description: 'Receive checkout.session.completed, invoice payment, and subscription events.'
  }
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Apps' },
  { id: 'SOCIAL', label: 'Social & Messaging' },
  { id: 'DATA', label: 'Data & Storage' },
  { id: 'EMAIL', label: 'Email & Mail Servers' },
  { id: 'CALENDAR', label: 'Calendars & Scheduling' },
  { id: 'DEVELOPER', label: 'Webhooks & APIs' }
];

export default function AdminConnectionsClient({ initialConnections = [], whatsAppStats = {} }) {
  const [connections, setConnections] = useState(initialConnections);
  const [selectedApp, setSelectedApp] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailSearch, setDetailSearch] = useState('');

  // Map each connection to an app in the catalog
  const connectionsByApp = useMemo(() => {
    const map = {};
    APP_CATALOG.forEach(app => {
      map[app.id] = [];
    });

    connections.forEach(conn => {
      const p = (conn.providerName || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const matchedApp = APP_CATALOG.find(app => 
        app.id.toLowerCase() === p || 
        app.providerKey.toLowerCase() === p || 
        app.aliases.some(alias => alias.toLowerCase().replace(/[^a-z0-9_]/g, '') === p)
      );

      if (matchedApp) {
        map[matchedApp.id].push(conn);
      } else {
        // Fallback to custom webhook / generic
        if (!map['WEBHOOK']) map['WEBHOOK'] = [];
        map['WEBHOOK'].push(conn);
      }
    });

    return map;
  }, [connections]);

  // Filtered Apps in Catalog View
  const filteredApps = useMemo(() => {
    return APP_CATALOG.filter(app => {
      if (categoryFilter !== 'ALL' && app.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.name.toLowerCase().includes(q);
        const matchDesc = app.description.toLowerCase().includes(q);
        const matchCat = app.categoryLabel.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Connections for currently selected app (Detail Screen)
  const currentAppConnections = useMemo(() => {
    if (!selectedApp) return [];
    const list = connectionsByApp[selectedApp.id] || [];
    if (!detailSearch.trim()) return list;

    const q = detailSearch.toLowerCase();
    return list.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.accountEmail || '').toLowerCase().includes(q) ||
      (c.client?.name || '').toLowerCase().includes(q) ||
      (c.client?.email || '').toLowerCase().includes(q)
    );
  }, [selectedApp, connectionsByApp, detailSearch]);

  const totalConnectedAccounts = connections.length;
  const distinctTenantsCount = useMemo(() => {
    const set = new Set(connections.map(c => c.client?.id).filter(Boolean));
    return set.size;
  }, [connections]);

  return (
    <div className="space-y-6">
      {/* 1. APP DETAIL / INTERNAL SCREEN */}
      {selectedApp ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back Button & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111] border border-border-subtle p-5 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedApp(null);
                  setDetailSearch('');
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              >
                <ArrowLeft size={15} />
                <span>Back to All Apps</span>
              </button>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${selectedApp.color}`}>
                  <selectedApp.icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedApp.name}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                      {selectedApp.categoryLabel}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                    {selectedApp.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs">
                <span className="text-text-tertiary">Connected Accounts: </span>
                <strong className="text-accent-blue font-bold">{(connectionsByApp[selectedApp.id] || []).length}</strong>
              </div>
            </div>
          </div>

          {/* WhatsApp Dedicated Model B Banner */}
          {selectedApp.id === 'WHATSAPP' && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-emerald-300">Model B Architecture: Direct Meta Billing Active</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Zero Financial Liability
                  </span>
                </div>
                <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                  Every tenant links their own WhatsApp Business Account (WABA ID, Phone Number ID, Permanent System User Token). Meta bills conversation fees directly to the tenant's credit card. Automatix charges a predictable recurring SaaS add-on fee with zero markup or debt risk.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-text-tertiary">
                  <span>🔒 Privacy-Compliant (E.164 numbers masked)</span>
                  <span>•</span>
                  <span>⚡ Direct Meta Graph API v21.0</span>
                  <span>•</span>
                  <span>📱 Non-invasive Template Sync</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/admin/settings"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  Configure Add-on Pricing →
                </Link>
              </div>
            </div>
          )}

          {/* Table Toolbar / Search */}
          <div className="flex items-center justify-between gap-4 bg-[#111] border border-border-subtle p-3.5 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by connection label, tenant name, or account email..."
                value={detailSearch}
                onChange={(e) => setDetailSearch(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
              />
              {detailSearch && (
                <button
                  type="button"
                  onClick={() => setDetailSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="text-xs text-text-tertiary">
              Showing {currentAppConnections.length} provisioned integration{(currentAppConnections.length === 1 ? '' : 's')}
            </div>
          </div>

          {/* Connected Accounts Table */}
          <div className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            {currentAppConnections.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <selectedApp.icon size={36} className="text-text-tertiary mx-auto opacity-40" />
                <h3 className="text-sm font-semibold text-white">No Connected Tenant Accounts</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  {detailSearch 
                    ? 'No provisioned connections matched your search filter.' 
                    : `No tenants have connected their ${selectedApp.name} accounts yet. Provisioned credentials will appear here once connected.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    {selectedApp.id === 'WHATSAPP' ? (
                      <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold bg-white/[0.02]">
                        <th className="py-3.5 px-4 w-[24%]">Connection Name</th>
                        <th className="py-3.5 px-4 w-[22%]">Tenant / Owner</th>
                        <th className="py-3.5 px-4 w-[22%]">Display Phone / WABA ID</th>
                        <th className="py-3.5 px-4 w-[12%] text-center">Meta Templates</th>
                        <th className="py-3.5 px-4 w-[12%] text-center">Volume</th>
                        <th className="py-3.5 px-4 w-[8%] text-center">Actions</th>
                      </tr>
                    ) : (
                      <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold bg-white/[0.02]">
                        <th className="py-3.5 px-4 w-[25%]">Connection Name</th>
                        <th className="py-3.5 px-4 w-[25%]">Tenant / Owner</th>
                        <th className="py-3.5 px-4 w-[25%]">Account Identifier / Email</th>
                        <th className="py-3.5 px-4 w-[15%]">Provisioned Date</th>
                        <th className="py-3.5 px-4 w-[10%] text-center">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentAppConnections.map((row) => {
                      if (selectedApp.id === 'WHATSAPP') {
                        const stats = whatsAppStats[row.id] || { templateCount: 0, messageCount: 0 };
                        return (
                          <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-xs">{row.name || 'WhatsApp Account'}</div>
                              <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Direct Meta Billing
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <Link href={`/admin/users/${row.client?.id}`} className="block group">
                                <div className="text-xs font-semibold text-white group-hover:text-accent-blue transition-colors">
                                  {row.client?.name || 'Tenant User'}
                                </div>
                                <div className="text-[11px] text-text-tertiary group-hover:text-accent-blue/70 transition-colors font-mono">
                                  {row.client?.email}
                                </div>
                              </Link>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs text-white font-mono">{row.accountEmail || 'Direct Number'}</div>
                              <div className="text-[10px] text-text-tertiary font-mono mt-0.5 flex flex-wrap items-center gap-x-1.5">
                                <TruncatedText text={row.clientEmail || 'N/A'} prefix="WABA: " maxChars={12} copyable={!!row.clientEmail} />
                                <span>•</span>
                                <TruncatedText text={row.privateKey || 'N/A'} prefix="Phone ID: " maxChars={12} copyable={!!row.privateKey} />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {stats.templateCount} Templates
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 text-text-secondary border border-white/10">
                                {stats.messageCount} Sent
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <DeleteButton 
                                id={row.id} 
                                type="connection" 
                                confirmMessage={`Are you sure you want to delete the WhatsApp connection "${row.name}" owned by ${row.client?.email}? Any active workflows sending WhatsApp messages with this connection will fail.`} 
                              />
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-xs">{row.name || 'Unnamed Connection'}</div>
                            <div className="text-[10px] text-accent-blue font-mono mt-0.5 uppercase tracking-wider">{row.providerName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Link href={`/admin/users/${row.client?.id}`} className="block group">
                              <div className="text-xs font-semibold text-white group-hover:text-accent-blue transition-colors">
                                {row.client?.name || 'Tenant User'}
                              </div>
                              <div className="text-[11px] text-text-tertiary group-hover:text-accent-blue/70 transition-colors font-mono">
                                {row.client?.email}
                              </div>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <TruncatedText 
                              text={row.accountEmail || row.spreadsheetId || 'Provisioned via Token'} 
                              maxChars={24} 
                              copyable={!!(row.accountEmail || row.spreadsheetId)} 
                              className="text-xs text-text-secondary font-mono bg-black/40 px-2 py-1 rounded border border-white/5 inline-block"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-text-tertiary">
                            {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <DeleteButton 
                              id={row.id} 
                              type="connection" 
                              confirmMessage={`Are you sure you want to delete the ${row.providerName} connection "${row.name}" owned by ${row.client?.email}? Any running workflows utilizing this integration will fail.`} 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. CATEGORIZED APPS CATALOG SCREEN */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Overview Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">Available Integrations</span>
                <span className="text-xl font-bold text-white mt-1 block">{APP_CATALOG.length} Apps</span>
              </div>
              <div className="p-2.5 bg-accent-blue/10 text-accent-blue rounded-xl border border-accent-blue/20">
                <LinkIcon size={18} />
              </div>
            </div>

            <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">Active Tenant Connections</span>
                <span className="text-xl font-bold text-white mt-1 block">{totalConnectedAccounts} Linked</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider block">Connected Tenants</span>
                <span className="text-xl font-bold text-white mt-1 block">{distinctTenantsCount} Tenants</span>
              </div>
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Users size={18} />
              </div>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#111] border border-border-subtle p-4 rounded-xl shadow-lg">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search available apps by name, description, or capabilities..."
                className="w-full bg-background border border-border-subtle rounded-lg pl-10 pr-9 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Apps Grid */}
          <div className="space-y-8">
            {CATEGORIES.filter(c => c.id !== 'ALL').map(category => {
              const appsInCategory = filteredApps.filter(a => a.category === category.id);
              if (appsInCategory.length === 0) return null;

              return (
                <div key={category.id} className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-blue" />
                      {category.label} ({appsInCategory.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appsInCategory.map(app => {
                      const count = (connectionsByApp[app.id] || []).length;
                      const hasActive = count > 0;

                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApp(app)}
                          className="p-4 rounded-xl bg-[#111] border border-white/10 hover:border-accent-blue/40 transition-all flex flex-col justify-between gap-4 cursor-pointer group shadow-lg shadow-black/20 hover:shadow-accent-blue/5"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${app.color}`}>
                                  <app.icon size={20} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">
                                    {app.name}
                                  </h4>
                                  <span className="text-[10px] text-text-tertiary font-medium">{app.categoryLabel}</span>
                                </div>
                              </div>

                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-text-tertiary border border-white/10">
                                {app.tag}
                              </span>
                            </div>

                            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                              {app.description}
                            </p>
                          </div>

                          {/* Footer with connection count & drilldown link */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${hasActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                              <span className={hasActive ? 'text-white font-semibold' : 'text-text-tertiary'}>
                                {count} {count === 1 ? 'Connection' : 'Connections'}
                              </span>
                            </div>

                            <span className="text-xs font-semibold text-accent-blue group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              View Accounts &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
