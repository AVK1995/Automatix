'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Inbox, 
  MessageSquare, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
  HardDrive, 
  Mail, 
  Check, 
  X,
  Loader2,
  Download,
  Search,
  Filter,
  Calendar,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { exportToCsv } from '@/lib/csvExport';

export default function AdminDashboardClient({ 
  stats, 
  pendingQuotaRequests, 
  openTickets, 
  expiringUsers, 
  recentSignups,
  recentEmailLogs 
}) {
  const [activeTab, setActiveTab] = useState('urgent'); // 'urgent' | 'requests' | 'tickets' | 'subscriptions' | 'signups'
  const [requests, setRequests] = useState(pendingQuotaRequests);
  const [processingId, setProcessingId] = useState(null);
  
  // Live Search & Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'TODAY' | '7' | '30'

  const router = useRouter();

  const handleApproveRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/quota-requests/${requestId}/approve`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to approve request');
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Quota upgrade approved and applied!');
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/quota-requests/${requestId}/reject`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to reject request');
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request rejected');
      router.refresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Date filter evaluation
  const matchesDate = (dateStr) => {
    if (dateRange === 'ALL' || !dateStr) return true;
    const itemTime = new Date(dateStr).getTime();
    const now = Date.now();
    if (dateRange === 'TODAY') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      return itemTime >= todayStart;
    }
    const days = parseInt(dateRange, 10);
    return itemTime >= now - days * 24 * 60 * 60 * 1000;
  };

  const q = searchQuery.toLowerCase().trim();

  // Filtered Datasets based on live search query & date filter
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (!matchesDate(r.createdAt)) return false;
      if (!q) return true;
      return (
        r.user?.name?.toLowerCase().includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.requestedPlan?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
      );
    });
  }, [requests, dateRange, q]);

  const filteredTickets = useMemo(() => {
    return openTickets.filter(t => {
      if (!matchesDate(t.updatedAt)) return false;
      if (!q) return true;
      return (
        t.user?.name?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
      );
    });
  }, [openTickets, dateRange, q]);

  const filteredExpiringUsers = useMemo(() => {
    return expiringUsers.filter(u => {
      if (!matchesDate(u.subscriptionExpiresAt || u.storageGraceExpiresAt)) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.quotaTier?.toLowerCase().includes(q) ||
        u.subscriptionTier?.toLowerCase().includes(q) ||
        u.storageStatus?.toLowerCase().includes(q)
      );
    });
  }, [expiringUsers, dateRange, q]);

  const filteredSignups = useMemo(() => {
    return recentSignups.filter(u => {
      if (!matchesDate(u.createdAt)) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.subscriptionTier?.toLowerCase().includes(q) ||
        u.quotaTier?.toLowerCase().includes(q)
      );
    });
  }, [recentSignups, dateRange, q]);

  const filteredUrgentGrace = filteredExpiringUsers.filter(u => u.storageStatus === 'GRACE_PERIOD');
  const filteredUrgentCount = filteredRequests.length + filteredTickets.length + filteredUrgentGrace.length;
  const isFiltered = searchQuery.trim() !== '' || dateRange !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange('ALL');
  };

  // CSV Export Handlers
  const downloadUrgentActionsCsv = () => {
    const combinedData = [
      ...filteredUrgentGrace.map(u => ({
        type: 'GRACE_PERIOD_EXPIRED',
        title: `Overdue Account: ${u.name || u.email}`,
        client: u.email,
        details: `Plan: ${u.quotaTier}, AutoPay: ${u.autoPayEnabled ? 'ON' : 'OFF'}`,
        status: 'URGENT_PURGE',
        date: u.storageGraceExpiresAt ? new Date(u.storageGraceExpiresAt).toISOString() : 'Immediate'
      })),
      ...filteredRequests.map(r => ({
        type: 'QUOTA_UPGRADE_REQUEST',
        title: `Requested: ${r.requestedPlan}`,
        client: r.user?.email || 'N/A',
        details: r.message || 'No note',
        status: r.status,
        date: new Date(r.createdAt).toISOString()
      })),
      ...filteredTickets.map(t => ({
        type: 'OPEN_SUPPORT_TICKET',
        title: t.subject,
        client: t.user?.email || 'N/A',
        details: `Type: ${t.type}`,
        status: t.status,
        date: new Date(t.updatedAt).toISOString()
      }))
    ];

    const columns = [
      { key: 'type', label: 'Item Type' },
      { key: 'title', label: 'Title / Subject' },
      { key: 'client', label: 'Client Email' },
      { key: 'details', label: 'Details' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Timestamp' }
    ];

    exportToCsv(`urgent_actions_${new Date().toISOString().slice(0, 10)}.csv`, columns, combinedData);
  };

  const downloadRequestsCsv = () => {
    const columns = [
      { key: 'id', label: 'Request ID' },
      { label: 'Client Name', accessor: r => r.user?.name || 'Unknown' },
      { label: 'Client Email', accessor: r => r.user?.email || 'N/A' },
      { key: 'requestedPlan', label: 'Requested Plan' },
      { key: 'message', label: 'Client Note' },
      { key: 'status', label: 'Status' },
      { label: 'Submitted At', accessor: r => new Date(r.createdAt).toISOString() }
    ];
    exportToCsv(`tenant_requests_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredRequests);
  };

  const downloadTicketsCsv = () => {
    const columns = [
      { key: 'id', label: 'Ticket ID' },
      { key: 'subject', label: 'Subject' },
      { key: 'type', label: 'Category' },
      { key: 'status', label: 'Status' },
      { label: 'Client Name', accessor: t => t.user?.name || 'Unknown' },
      { label: 'Client Email', accessor: t => t.user?.email || 'N/A' },
      { label: 'Last Activity', accessor: t => new Date(t.updatedAt).toISOString() }
    ];
    exportToCsv(`support_queue_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredTickets);
  };

  const downloadSubscriptionsCsv = () => {
    const columns = [
      { key: 'id', label: 'User ID' },
      { label: 'Name', accessor: u => u.name || 'Unnamed' },
      { key: 'email', label: 'Email' },
      { key: 'subscriptionTier', label: 'Subscription Tier' },
      { key: 'quotaTier', label: 'Storage Quota' },
      { label: 'AutoPay Enabled', accessor: u => u.autoPayEnabled ? 'YES' : 'NO' },
      { key: 'storageStatus', label: 'Storage Status' },
      { label: 'Subscription Expiry', accessor: u => u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toISOString() : 'N/A' },
      { label: 'Grace Expiry', accessor: u => u.storageGraceExpiresAt ? new Date(u.storageGraceExpiresAt).toISOString() : 'N/A' }
    ];
    exportToCsv(`subscriptions_grace_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredExpiringUsers);
  };

  const downloadSignupsCsv = () => {
    const columns = [
      { key: 'id', label: 'User ID' },
      { label: 'Name', accessor: u => u.name || 'Unnamed' },
      { key: 'email', label: 'Email' },
      { key: 'subscriptionTier', label: 'Subscription Tier' },
      { key: 'quotaTier', label: 'Storage Quota' },
      { label: 'Registered At', accessor: u => new Date(u.createdAt).toISOString() }
    ];
    exportToCsv(`recent_signups_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredSignups);
  };

  return (
    <div className="w-full space-y-8">
      {/* Top Priority Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Admin Priority Command Center
            {filteredUrgentCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Flame size={12} className="text-amber-400" />
                {filteredUrgentCount} Actions Required
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time operational dashboard for urgent requests, support tickets, renewals, and tenant logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/notifications"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors flex items-center gap-2"
          >
            <Mail size={14} />
            Dispatch Broadcast
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 flex items-center gap-2"
          >
            Detailed Analytics &rarr;
          </Link>
        </div>
      </div>

      {/* Priority Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div 
          onClick={() => setActiveTab('requests')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filteredRequests.length > 0 ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50' : 'bg-[#111] border-border-subtle hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pending Requests</span>
            <Inbox size={16} className={filteredRequests.length > 0 ? 'text-amber-400' : 'text-text-tertiary'} />
          </div>
          <div className="text-2xl font-bold text-white">{filteredRequests.length}</div>
          <span className="text-[11px] text-text-tertiary block mt-1">Quota & Custom upgrades</span>
        </div>

        <div 
          onClick={() => setActiveTab('tickets')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filteredTickets.length > 0 ? 'bg-accent-blue/5 border-accent-blue/30 hover:border-accent-blue/50' : 'bg-[#111] border-border-subtle hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Support Queue</span>
            <MessageSquare size={16} className="text-accent-blue" />
          </div>
          <div className="text-2xl font-bold text-white">{filteredTickets.length}</div>
          <span className="text-[11px] text-text-tertiary block mt-1">Awaiting staff response</span>
        </div>

        <div 
          onClick={() => setActiveTab('subscriptions')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            filteredExpiringUsers.some(u => u.storageStatus === 'GRACE_PERIOD') ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/50' : 'bg-[#111] border-border-subtle hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Grace & Expirations</span>
            <CreditCard size={16} className="text-accent-violet" />
          </div>
          <div className="text-2xl font-bold text-white">{filteredExpiringUsers.length}</div>
          <span className="text-[11px] text-text-tertiary block mt-1">Overdue or &le;5 days renewal</span>
        </div>

        <div 
          onClick={() => setActiveTab('signups')}
          className="p-4 rounded-xl bg-[#111] border border-border-subtle hover:border-white/20 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Tenants</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          <span className="text-[11px] text-text-tertiary block mt-1">{filteredSignups.length} active in view</span>
        </div>
      </div>

      {/* LIVE SEARCH & FILTER TOOLBAR */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant name, email, plan, subject, or query notes..."
            className="w-full bg-background border border-border-subtle rounded-lg pl-10 pr-9 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Date Range Selector & Reset Button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Calendar size={14} className="text-accent-blue" />
            <span className="font-medium hidden sm:inline">Date:</span>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7', label: '7 Days' },
              { id: '30', label: '30 Days' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  dateRange === range.id
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Priority Action Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('urgent')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'urgent' ? 'border-amber-400 text-amber-400' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Flame size={14} />
          All Urgent Actions ({filteredUrgentCount})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'requests' ? 'border-accent-blue text-white' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Inbox size={14} />
          Tenant Requests ({filteredRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'tickets' ? 'border-accent-blue text-white' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <MessageSquare size={14} />
          Support Queue ({filteredTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'subscriptions' ? 'border-accent-blue text-white' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <CreditCard size={14} />
          Subscriptions & Expiry ({filteredExpiringUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('signups')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
            activeTab === 'signups' ? 'border-accent-blue text-white' : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Users size={14} />
          Recent Signups ({filteredSignups.length})
        </button>
      </div>

      {/* TAB 1: ALL URGENT ACTIONS (CONSOLIDATED QUEUE) */}
      {activeTab === 'urgent' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary font-medium">
              Consolidated Priority Action Queue {isFiltered && `(Filtered: ${filteredUrgentCount} items)`}
            </span>
            <button
              onClick={downloadUrgentActionsCsv}
              disabled={filteredUrgentCount === 0}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download size={13} />
              Download Tab CSV
            </button>
          </div>

          {filteredUrgentCount === 0 ? (
            <div className="bg-[#111] border border-border-subtle rounded-xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-semibold text-white">All Clear! No Urgent Actions Found</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md">
                {isFiltered ? 'No urgent items match your active search or date filter criteria.' : 'There are no overdue accounts, unanswered support tickets, or pending quota requests right now.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overdue Grace Period Accounts */}
              {filteredUrgentGrace.map((user) => (
                <div key={user.id} className="bg-[#111] border border-red-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-500/5">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                          5-Day Grace Period Active
                        </span>
                        <span className="text-xs text-text-tertiary">Purge Date: {user.storageGraceExpiresAt ? new Date(user.storageGraceExpiresAt).toLocaleDateString() : 'Immediate'}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{user.name || user.email}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Storage Plan: {user.quotaTier} • AutoPay: {user.autoPayEnabled ? 'Enabled' : 'Disabled'} • Email: {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/10"
                    >
                      Manage Tenant
                    </Link>
                  </div>
                </div>
              ))}

              {/* Pending Quota Requests */}
              {filteredRequests.map((req) => (
                <div key={req.id} className="bg-[#111] border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <Inbox size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Pending Quota Request
                        </span>
                        <span className="text-xs text-text-tertiary">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{req.user?.name || req.user?.email}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Requested Plan: <span className="text-accent-blue font-medium">{req.requestedPlan}</span>
                      </p>
                      {req.message && (
                        <p className="text-xs text-text-tertiary italic mt-1 bg-white/[0.02] p-2 rounded border border-white/5">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-red-400 hover:bg-red-400/10 border border-white/10 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      disabled={processingId === req.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors flex items-center gap-1.5"
                    >
                      {processingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Grant Access & Activate Plan
                    </button>
                  </div>
                </div>
              ))}

              {/* Open Support Tickets */}
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#111] border border-border-subtle rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue shrink-0 mt-0.5">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                          {ticket.type || 'Support'}
                        </span>
                        <span className="text-xs text-text-tertiary">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{ticket.subject}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Client: {ticket.user?.name || ticket.user?.email} • Status: <span className="text-amber-400 font-medium capitalize">{ticket.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/admin/support"
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/10 flex items-center gap-1.5"
                    >
                      Reply to Ticket &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TENANT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Inbox size={18} className="text-accent-blue" />
                Pending Quota & Setup Requests
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Review client requests to expand storage quotas or provision configurations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadRequestsCsv}
                disabled={filteredRequests.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                Download CSV
              </button>
              <Link href="/admin/requests" className="text-xs text-accent-blue hover:underline flex items-center gap-1">
                Requests Hub &rarr;
              </Link>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
              {isFiltered ? 'No quota requests match your search criteria.' : 'No pending quota requests.'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredRequests.map((req) => (
                <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-white">{req.user?.name || req.user?.email}</span>
                      <span className="text-[11px] text-text-tertiary">({req.user?.email})</span>
                    </div>
                    <div className="text-xs text-accent-blue font-medium">
                      Requested Plan: {req.requestedPlan}
                    </div>
                    {req.message && (
                      <p className="text-xs text-text-secondary mt-1 italic">
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-red-400 hover:bg-red-400/10 border border-white/10 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveRequest(req.id)}
                      disabled={processingId === req.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors flex items-center gap-1.5"
                    >
                      {processingId === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Approve & Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPORT QUEUE */}
      {activeTab === 'tickets' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-accent-blue" />
                Active Support Tickets
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Support tickets and inquiries awaiting administrative review.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadTicketsCsv}
                disabled={filteredTickets.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                Download CSV
              </button>
              <Link href="/admin/support" className="text-xs text-accent-blue hover:underline flex items-center gap-1">
                Open Support Desk &rarr;
              </Link>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
              {isFiltered ? 'No tickets match your search criteria.' : 'No active support tickets.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {t.user?.name || t.user?.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-text-secondary border border-white/10">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/admin/support"
                          className="px-3 py-1.5 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-semibold transition-colors"
                        >
                          Reply
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBSCRIPTIONS & EXPIRY STATUS */}
      {activeTab === 'subscriptions' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-accent-blue" />
                Subscription Renewals & Grace Period Monitor
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Monitor accounts nearing expiration, AutoPay status, and 5-day grace purge countdowns.
              </p>
            </div>
            <button
              onClick={downloadSubscriptionsCsv}
              disabled={filteredExpiringUsers.length === 0}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              <Download size={13} />
              Download CSV
            </button>
          </div>

          {filteredExpiringUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
              {isFiltered ? 'No subscription records match your search criteria.' : 'No accounts currently near expiration or in grace period.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold">
                    <th className="py-3 px-4">Tenant</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Storage Quota</th>
                    <th className="py-3 px-4">AutoPay</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExpiringUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{u.name || 'Unnamed'}</span>
                        <span className="text-[11px] text-text-tertiary">{u.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white capitalize">
                        {u.subscriptionTier || 'Free'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {u.quotaTier || '50 MB'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.autoPayEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-text-secondary'
                        }`}>
                          {u.autoPayEnabled ? 'Auto-Pay ON' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.storageStatus === 'GRACE_PERIOD' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {u.storageStatus === 'GRACE_PERIOD' ? 'Grace Period' : 'Expiring Soon'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/10"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RECENT SIGNUPS */}
      {activeTab === 'signups' && (
        <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-accent-blue" />
                Recent Tenant Signups
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                New clients registered on the platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadSignupsCsv}
                disabled={filteredSignups.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                Download CSV
              </button>
              <Link href="/admin/users" className="text-xs text-accent-blue hover:underline flex items-center gap-1">
                View All Tenants &rarr;
              </Link>
            </div>
          </div>

          {filteredSignups.length === 0 ? (
            <div className="py-16 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
              {isFiltered ? 'No signups match your search criteria.' : 'No recent signups.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSignups.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {u.name || 'Unnamed Client'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-text-secondary border border-white/10 capitalize">
                          {u.subscriptionTier || 'Starter'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-tertiary">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors border border-white/10"
                        >
                          Details
                        </Link>
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
