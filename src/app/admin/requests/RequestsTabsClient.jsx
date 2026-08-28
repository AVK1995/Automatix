'use client';

import { useState, useMemo } from 'react';
import { 
  Database, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Calendar, 
  Download, 
  X, 
  RotateCcw,
  Loader2,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { exportToCsv } from '@/lib/csvExport';

export default function RequestsTabsClient({ quotaRequests = [], conciergeRequests = [], refundRequests = [] }) {
  const [activeTab, setActiveTab] = useState('quota');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'TODAY' | '7' | '30'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  const router = useRouter();

  const handleApproveQuota = async (requestId) => {
    setIsProcessing(true);
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/quota-requests/${requestId}/approve`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to approve request');
      toast.success('Quota request approved successfully');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const initiateRejectQuota = (requestId) => {
    setRejectingId(requestId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectQuota = async () => {
    if (!rejectingId) return;
    setIsProcessing(true);
    setProcessingId(rejectingId);
    try {
      const res = await fetch(`/api/admin/quota-requests/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || 'Your request was reviewed and rejected by the administration team.' })
      });
      if (!res.ok) throw new Error('Failed to reject request');
      toast.success('Quota request rejected');
      setRejectModalOpen(false);
      setRejectingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  // Date Filter evaluation
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

  // Filtered Datasets
  const filteredQuota = useMemo(() => {
    return quotaRequests.filter(req => {
      if (!matchesDate(req.createdAt)) return false;
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
      if (!q) return true;
      return (
        req.user?.name?.toLowerCase().includes(q) ||
        req.user?.email?.toLowerCase().includes(q) ||
        req.requestedPlan?.toLowerCase().includes(q) ||
        req.message?.toLowerCase().includes(q) ||
        req.status?.toLowerCase().includes(q)
      );
    });
  }, [quotaRequests, dateRange, statusFilter, q]);

  const filteredConcierge = useMemo(() => {
    return conciergeRequests.filter(ticket => {
      if (!matchesDate(ticket.createdAt)) return false;
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ticket.user?.name?.toLowerCase().includes(q) ||
        ticket.user?.email?.toLowerCase().includes(q) ||
        ticket.subject?.toLowerCase().includes(q) ||
        ticket.message?.toLowerCase().includes(q)
      );
    });
  }, [conciergeRequests, dateRange, statusFilter, q]);

  const filteredRefunds = useMemo(() => {
    return refundRequests.filter(ticket => {
      if (!matchesDate(ticket.createdAt)) return false;
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ticket.user?.name?.toLowerCase().includes(q) ||
        ticket.user?.email?.toLowerCase().includes(q) ||
        ticket.subject?.toLowerCase().includes(q) ||
        ticket.message?.toLowerCase().includes(q)
      );
    });
  }, [refundRequests, dateRange, statusFilter, q]);

  const isFiltered = searchQuery.trim() !== '' || dateRange !== 'ALL' || statusFilter !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange('ALL');
    setStatusFilter('ALL');
  };

  const downloadCurrentTabCsv = () => {
    if (activeTab === 'quota') {
      const columns = [
        { key: 'id', label: 'Request ID' },
        { label: 'Client Name', accessor: r => r.user?.name || 'Unknown' },
        { label: 'Client Email', accessor: r => r.user?.email || 'N/A' },
        { key: 'requestedPlan', label: 'Requested Plan' },
        { key: 'message', label: 'Client Note' },
        { key: 'status', label: 'Status' },
        { label: 'Submitted At', accessor: r => new Date(r.createdAt).toISOString() }
      ];
      exportToCsv(`quota_requests_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredQuota);
    } else if (activeTab === 'concierge') {
      const columns = [
        { key: 'id', label: 'Ticket ID' },
        { label: 'Client Email', accessor: t => t.user?.email || 'N/A' },
        { key: 'subject', label: 'Subject' },
        { key: 'message', label: 'Details' },
        { key: 'status', label: 'Status' },
        { label: 'Created At', accessor: t => new Date(t.createdAt).toISOString() }
      ];
      exportToCsv(`concierge_requests_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredConcierge);
    } else {
      const columns = [
        { key: 'id', label: 'Ticket ID' },
        { label: 'Client Email', accessor: t => t.user?.email || 'N/A' },
        { key: 'subject', label: 'Subject' },
        { key: 'message', label: 'Details' },
        { key: 'status', label: 'Status' },
        { label: 'Created At', accessor: t => new Date(t.createdAt).toISOString() }
      ];
      exportToCsv(`refund_requests_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredRefunds);
    }
  };

  const tabs = [
    { id: 'quota', label: 'Storage Quotas', icon: <Database size={14} />, count: filteredQuota.filter(r => r.status === 'PENDING').length },
    { id: 'concierge', label: 'Concierge Setup', icon: <HelpCircle size={14} />, count: filteredConcierge.length },
    { id: 'refunds', label: 'Refunds', icon: <RefreshCw size={14} />, count: filteredRefunds.length }
  ];

  return (
    <div className="space-y-6">
      {/* Live Search & Filter Bar */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client email, name, plan tier, or notes..."
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

        {/* Date Filter & Status Filter */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'REJECTED', label: 'Rejected' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === st.id
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7', label: '7d' },
              { id: '30', label: '30d' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  dateRange === range.id
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Download CSV */}
          <button
            onClick={downloadCurrentTabCsv}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>

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

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors relative top-px shrink-0 ${
              activeTab === tab.id 
                ? 'border-accent-blue text-white' 
                : 'border-transparent text-text-secondary hover:text-white hover:border-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-accent-blue text-white' : 'bg-white/10 text-text-secondary'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        
        {/* QUOTA TAB */}
        {activeTab === 'quota' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Storage Quota Requests ({filteredQuota.length})
              </h2>
            </div>

            {filteredQuota.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
                {isFiltered ? 'No quota requests match your active search filter.' : 'No storage quota requests.'}
              </div>
            ) : (
              filteredQuota.map(req => (
                <div key={req.id} className="bg-background border border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                        req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-text-tertiary">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-text-secondary">Client: </span>
                      <span className="text-white font-semibold">{req.user?.name ? `${req.user.name} (${req.user.email})` : req.user?.email}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-text-secondary">Requested Plan: </span>
                      <span className="text-accent-blue font-medium">{req.requestedPlan}</span>
                    </div>
                    {req.message && (
                      <div className="text-xs text-text-secondary mt-2 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                        <span className="text-white font-medium block mb-0.5">Client Query / Notes:</span>
                        "{req.message}"
                      </div>
                    )}
                  </div>
                  
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => initiateRejectQuota(req.id)}
                        disabled={isProcessing && processingId === req.id}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg border border-white/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button 
                        onClick={() => handleApproveQuota(req.id)}
                        disabled={isProcessing && processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-accent-blue hover:bg-accent-blue/90 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isProcessing && processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Approve & Apply
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* CONCIERGE TAB */}
        {activeTab === 'concierge' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-4">Concierge Setup Requests ({filteredConcierge.length})</h2>
            {filteredConcierge.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
                {isFiltered ? 'No concierge requests match your search criteria.' : 'No pending concierge requests.'}
              </div>
            ) : (
              filteredConcierge.map(ticket => (
                <div key={ticket.id} className="bg-background border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-accent-violet px-2.5 py-0.5 rounded-full bg-accent-violet/10 border border-accent-violet/20">
                      {ticket.status}
                    </span>
                    <span className="text-xs text-text-tertiary">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{ticket.subject}</h3>
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed">{ticket.message}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                    <div className="text-xs">
                      <span className="text-text-secondary">Client: </span>
                      <span className="text-white font-medium">{ticket.user?.name ? `${ticket.user.name} (${ticket.user.email})` : ticket.user?.email}</span>
                    </div>
                    <a 
                      href={`mailto:${ticket.user.email}?subject=Automatix Concierge Setup`}
                      className="text-xs bg-white text-black px-3.5 py-1.5 rounded-lg hover:bg-white/90 transition-colors font-semibold"
                    >
                      Contact Client
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REFUNDS TAB */}
        {activeTab === 'refunds' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white mb-4">Refund Requests ({filteredRefunds.length})</h2>
            {filteredRefunds.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-secondary border-2 border-dashed border-white/5 rounded-xl">
                {isFiltered ? 'No refund requests match your search criteria.' : 'No pending refund requests.'}
              </div>
            ) : (
              filteredRefunds.map(ticket => (
                <div key={ticket.id} className="bg-background border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-accent-blue px-2.5 py-0.5 rounded-full bg-accent-blue/10 border border-accent-blue/20">
                      {ticket.status}
                    </span>
                    <span className="text-xs text-text-tertiary">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{ticket.subject}</h3>
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed line-clamp-3">{ticket.message}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                    <div className="text-xs">
                      <span className="text-text-secondary">Client: </span>
                      <span className="text-white font-medium">{ticket.user?.name ? `${ticket.user.name} (${ticket.user.email})` : ticket.user?.email}</span>
                    </div>
                    <a 
                      href={`mailto:${ticket.user.email}?subject=Re: Your Automatix Refund Request`}
                      className="text-xs bg-white text-black px-3.5 py-1.5 rounded-lg hover:bg-white/90 transition-colors font-semibold"
                    >
                      Email Client
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <XCircle className="text-red-400 w-4 h-4" /> Reject Quota Request
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-text-tertiary hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Reason for Rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Please optimize your current storage first, or upgrade to a higher tier plan."
                  rows={4}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                />
                <p className="text-[10px] text-text-tertiary mt-2">
                  This reason will be synthesized and sent to the user via the in-app notification system.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRejectQuota}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
