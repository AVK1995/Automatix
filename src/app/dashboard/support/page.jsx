'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  Crown, 
  HardDrive, 
  Receipt, 
  RefreshCw, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  Check,
  Inbox
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';
import { resolveTicketNotifications } from '@/actions/notifications';

export default function SupportPage() {
  const [activeMainTab, setActiveMainTab] = useState('support'); // 'support' | 'requests'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Raised requests state
  const [raisedData, setRaisedData] = useState({
    quotaRequests: [],
    conciergeRequests: [],
    refundRequests: [],
    supportTickets: []
  });
  const [loadingRaised, setLoadingRaised] = useState(false);
  const [requestFilter, setRequestFilter] = useState('ALL'); // 'ALL' | 'QUOTA' | 'CONCIERGE' | 'REFUND'
  const [previewImage, setPreviewImage] = useState(null);

  // New ticket state
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('GENERAL');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  useEffect(() => {
    if (activeMainTab === 'requests') {
      fetchRaisedRequests();
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (activeTicket?.id) {
      resolveTicketNotifications(activeTicket.id).catch(console.error);
    }
  }, [activeTicket?.id]);

  useEffect(() => {
    if (activeTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.id, activeTicket?.messages?.length]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      const ticketList = Array.isArray(data) ? data : [];
      setTickets(ticketList);
      
      if (ticketList.length > 0) {
        if (!activeTicket) {
          setActiveTicket(ticketList[0]);
        } else {
          const updatedActive = ticketList.find(t => t.id === activeTicket.id);
          if (updatedActive) {
            setActiveTicket(prev => ({
              ...prev,
              ...updatedActive
            }));
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaisedRequests = async () => {
    setLoadingRaised(true);
    try {
      const res = await fetch('/api/user/raised-requests');
      const data = await res.json();
      if (res.ok) {
        setRaisedData(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRaised(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType, subject: newSubject.trim(), message: newMessage.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      toast.success('Ticket submitted! An admin will review and accept your chat.');
      setIsCreating(false);
      setNewSubject('');
      setNewMessage('');
      fetchTickets();
      if (activeMainTab === 'requests') fetchRaisedRequests();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() })
      });
      if (!res.ok) throw new Error('Failed to send message');

      const newMsg = await res.json();
      setActiveTicket({
        ...activeTicket,
        messages: [...(activeTicket.messages || []), newMsg]
      });
      setReplyText('');
      toast.success('Message sent');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReplying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'IN_PROGRESS': return 'text-accent-blue bg-accent-blue/10 border-accent-blue/20';
      case 'RESOLVED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'CLOSED': return 'text-text-tertiary bg-white/5 border-white/10';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  const getQuotaStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'REJECTED': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  const totalRaisedCount = (raisedData.quotaRequests?.length || 0) + (raisedData.conciergeRequests?.length || 0) + (raisedData.refundRequests?.length || 0);

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
            <MessageSquare size={22} className="text-accent-blue" />
            Support & Help Desk / Requests
          </h1>
          <p className="text-sm text-text-secondary">
            Submit support inquiries, track raised quota upgrades, concierge setups, and refunds.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-accent-blue/10 cursor-pointer"
          >
            <Plus size={15} /> Raise Support Ticket
          </button>
        </div>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveMainTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'support'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <MessageSquare size={14} />
          <span>Support & Help Desk</span>
          {tickets.length > 0 && (
            <span className="px-2 py-0.2 rounded-full bg-white/10 text-[10px] text-white">
              {tickets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'requests'
              ? 'border-accent-blue text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Inbox size={14} />
          <span>My Raised Requests</span>
          {totalRaisedCount > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-[10px] ${
              activeMainTab === 'requests' ? 'bg-accent-blue text-white font-bold' : 'bg-white/10 text-text-secondary'
            }`}>
              {totalRaisedCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: SUPPORT & HELP DESK */}
      {activeMainTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Left Side: Ticket List */}
          <div className="lg:col-span-4 bg-[#111] border border-border-subtle rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Your Tickets ({tickets.length})</span>
            </div>

            {tickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <MessageSquare size={32} className="text-text-tertiary mb-3" />
                <p className="text-white font-medium text-sm">No support tickets</p>
                <p className="text-text-tertiary text-xs mt-1">Need help? Open a support ticket to start chatting.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {tickets.map(ticket => {
                  const isSelected = activeTicket?.id === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 cursor-pointer ${
                        isSelected ? 'bg-accent-blue/10 border-l-2 border-accent-blue' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-white truncate max-w-[200px]">
                          {ticket.subject}
                        </span>
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-text-tertiary text-xs line-clamp-1">
                        {ticket.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-text-secondary mt-1">
                        <span className="capitalize">{ticket.type.toLowerCase()}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Chat / Message Thread */}
          <div className="lg:col-span-8 bg-[#111] border border-border-subtle rounded-xl flex flex-col min-h-[500px] max-h-[650px]">
            {activeTicket ? (
              <>
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      {activeTicket.subject}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(activeTicket.status)}`}>
                        {activeTicket.status}
                      </span>
                    </h2>
                    <span className="text-xs text-text-tertiary">Type: {activeTicket.type} • Ticket ID: {activeTicket.id.slice(0, 8)}...</span>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {/* Initial Ticket Message */}
                  <div className="flex flex-col items-start max-w-[85%]">
                    <div className="p-3 bg-zinc-900 border border-white/10 rounded-2xl rounded-tl-sm text-xs text-white leading-relaxed">
                      {activeTicket.message}
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 ml-1">{new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Thread Messages */}
                  {activeTicket.messages?.map(msg => {
                    const isClient = msg.senderRole === 'USER' || msg.senderRole === 'CLIENT';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isClient ? 'items-end' : 'items-start'} max-w-[85%] ${isClient ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isClient 
                            ? 'bg-accent-blue text-white rounded-tr-sm' 
                            : 'bg-zinc-800 border border-white/10 text-white rounded-tl-sm'
                        }`}>
                          {!isClient && <span className="text-[10px] font-bold text-sky-400 block mb-1">Automatix Support Agent</span>}
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-text-tertiary mt-1 mx-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Box */}
                {activeTicket.status !== 'CLOSED' ? (
                  <form onSubmit={handleReply} className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your message to support..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                    />
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="p-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-white/5 bg-white/[0.01] text-center text-xs text-text-tertiary">
                    This ticket has been marked as closed.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <MessageSquare size={32} className="text-text-tertiary mb-3" />
                <p className="text-white font-medium text-sm">Select a ticket</p>
                <p className="text-text-tertiary text-xs mt-1">Choose a ticket from the left to view conversation history.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY RAISED REQUESTS */}
      {activeMainTab === 'requests' && (
        <div className="space-y-6">
          {/* Subfilter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111] border border-border-subtle p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mr-2">Filter Requests:</span>
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'QUOTA', label: 'Plan & Storage Upgrades' },
                { id: 'CONCIERGE', label: 'Concierge Setups' },
                { id: 'REFUND', label: 'Refund Requests' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRequestFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    requestFilter === tab.id
                      ? 'bg-accent-blue text-white shadow-sm'
                      : 'bg-white/5 text-text-secondary hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchRaisedRequests}
              className="p-1.5 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Refresh requests"
            >
              <RefreshCw size={14} className={loadingRaised ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingRaised ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin text-accent-blue mx-auto mb-2" size={24} />
              <p className="text-xs text-text-secondary">Loading your raised requests...</p>
            </div>
          ) : totalRaisedCount === 0 ? (
            <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center space-y-3">
              <Inbox size={36} className="text-text-tertiary mx-auto" />
              <h3 className="text-sm font-bold text-white">No Requests Found</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                You haven't submitted any plan upgrade requests, storage expansions, concierge setups, or refund tickets yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Storage & Plan Upgrade Quota Requests */}
              {(requestFilter === 'ALL' || requestFilter === 'QUOTA') && raisedData.quotaRequests?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Database size={14} className="text-accent-blue" />
                    <span>Plan & Storage Quota Requests ({raisedData.quotaRequests.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {raisedData.quotaRequests.map(req => (
                      <div 
                        key={req.id} 
                        className="p-4 bg-[#111] border border-white/10 hover:border-accent-blue/30 rounded-xl space-y-3 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-tertiary font-mono block">REQUEST #{req.id.slice(0, 8)}</span>
                            <h4 className="text-sm font-bold text-white truncate">{req.requestedPlan}</h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${getQuotaStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>

                        {req.message && (
                          <p className="text-xs text-text-secondary bg-white/[0.02] p-2.5 rounded-lg border border-white/5 leading-relaxed">
                            {req.message}
                          </p>
                        )}

                        {req.receiptUrl && (
                          <div className="p-2.5 bg-black/40 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                            <img
                              src={req.receiptUrl}
                              alt="Receipt"
                              className="w-10 h-10 object-cover rounded-lg border border-white/10 cursor-pointer"
                              onClick={() => setPreviewImage(req.receiptUrl)}
                            />
                            <div className="min-w-0 text-xs">
                              <span className="text-[10px] font-bold text-emerald-400 block">Payment Receipt Attached</span>
                              <button
                                type="button"
                                onClick={() => setPreviewImage(req.receiptUrl)}
                                className="text-sky-400 hover:underline text-[11px] cursor-pointer"
                              >
                                View Receipt Image &rarr;
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-white/5">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-accent-blue font-medium">
                            {req.status === 'PENDING' ? '24h Review Active' : req.status === 'APPROVED' ? 'Limits Activated' : 'Review Complete'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Concierge Setup Inquiries */}
              {(requestFilter === 'ALL' || requestFilter === 'CONCIERGE') && raisedData.conciergeRequests?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>White-Glove Concierge Setups ({raisedData.conciergeRequests.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {raisedData.conciergeRequests.map(ticket => (
                      <div key={ticket.id} className="p-4 bg-[#111] border border-white/10 rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-white truncate">{ticket.subject}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                          {ticket.message}
                        </p>
                        <div className="text-[11px] text-text-tertiary">
                          Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Refund Inquiries */}
              {(requestFilter === 'ALL' || requestFilter === 'REFUND') && raisedData.refundRequests?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw size={14} className="text-red-400" />
                    <span>Refund Requests ({raisedData.refundRequests.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {raisedData.refundRequests.map(ticket => (
                      <div key={ticket.id} className="p-4 bg-[#111] border border-white/10 rounded-xl space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-white truncate">{ticket.subject}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                          {ticket.message}
                        </p>
                        <div className="text-[11px] text-text-tertiary">
                          Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Support Ticket Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70"
              onClick={() => setIsCreating(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0e0e13] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white">Raise Support Ticket</h3>
                <button onClick={() => setIsCreating(false)} className="p-1 rounded text-text-tertiary hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Inquiry Type</label>
                  <Select
                    value={newType}
                    onChange={setNewType}
                    options={[
                      { value: 'GENERAL', label: 'General Inquiry' },
                      { value: 'BILLING', label: 'Billing & Plan Issue' },
                      { value: 'TECHNICAL', label: 'Technical Automation Issue' },
                      { value: 'CONCIERGE', label: 'Concierge Workflow Setup' },
                      { value: 'REFUND', label: 'Refund Request' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief summary of your issue..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Please explain the issue or what assistance you need..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-xs text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-accent-blue/20 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80" onClick={() => setPreviewImage(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl max-h-[85vh] bg-[#0e0e13] border border-white/10 rounded-2xl p-4 z-10 overflow-hidden flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white">Payment Receipt Image</span>
                <button onClick={() => setPreviewImage(null)} className="text-text-tertiary hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-auto max-h-[70vh] flex items-center justify-center">
                <img src={previewImage} alt="Payment Receipt" className="max-w-full max-h-[65vh] object-contain rounded-lg" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
