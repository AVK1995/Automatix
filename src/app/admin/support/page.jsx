'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Loader2, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  Send, 
  X, 
  Check, 
  AlertCircle, 
  User, 
  Download,
  Lock,
  Sparkles,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToCsv } from '@/lib/csvExport';

export default function GlobalSupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // New Direct Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const fetcher = (url) => fetch(url).then(r => r.json());
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/support?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`, 
    fetcher, 
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const tickets = data?.tickets || [];

  // Real-time polling for active ticket message thread
  const { data: fullActiveTicketData, mutate: mutateActiveTicket } = useSWR(
    activeTicket?.id ? `/api/support/tickets/${activeTicket.id}` : null,
    fetcher,
    { refreshInterval: 2500, revalidateOnFocus: true }
  );

  // Sync active ticket thread automatically when new data arrives
  useEffect(() => {
    if (fullActiveTicketData && fullActiveTicketData.id === activeTicket?.id) {
      setActiveTicket(prev => {
        if (!prev) return fullActiveTicketData;
        return {
          ...prev,
          ...fullActiveTicketData
        };
      });
    }
  }, [fullActiveTicketData]);

  // Auto-scroll chat stream to bottom when active ticket or messages update
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (activeTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.id, activeTicket?.messages?.length]);

  // Search users for new direct conversation
  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingUser(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUserSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingUser(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const handleCreateDirectChat = async (e) => {
    e.preventDefault();
    if (!selectedUser) return toast.error('Please select a recipient tenant');
    if (!newChatMessage.trim()) return toast.error('Please enter an initial message');

    setIsCreatingChat(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          subject: newChatSubject.trim() || 'Direct Administrator Support',
          message: newChatMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate conversation');

      toast.success(`Direct conversation opened with ${selectedUser.name || selectedUser.email}`);
      setIsNewChatModalOpen(false);
      setSelectedUser(null);
      setUserSearchQuery('');
      setNewChatSubject('');
      setNewChatMessage('');
      mutate();
      if (data.ticket) {
        setActiveTicket(data.ticket);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setActiveTicket(ticket);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      if (res.ok) {
        const fullTicket = await res.json();
        setActiveTicket(fullTicket);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Ticket status updated to ${newStatus}`);
      setActiveTicket(prev => ({ ...prev, status: newStatus }));
      mutateActiveTicket();
      mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const sendingContent = replyText.trim();
    setReplyText('');
    setReplying(true);

    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: sendingContent })
      });
      if (!res.ok) throw new Error('Failed to send reply');

      const newMsg = await res.json();
      setActiveTicket(prev => ({
        ...prev,
        status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status,
        messages: [...(prev.messages || []), newMsg]
      }));
      toast.success('Reply sent');
      mutateActiveTicket();
      mutate();
    } catch (err) {
      toast.error(err.message);
      setReplyText(sendingContent);
    } finally {
      setReplying(false);
    }
  };

  const exportAllTicketsCsv = () => {
    const columns = [
      { key: 'id', label: 'Ticket ID' },
      { key: 'subject', label: 'Subject' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { label: 'Client Name', accessor: t => t.user?.name || 'Unknown' },
      { label: 'Client Email', accessor: t => t.user?.email || 'N/A' },
      { label: 'Created At', accessor: t => new Date(t.createdAt).toISOString() },
      { label: 'Updated At', accessor: t => new Date(t.updatedAt).toISOString() }
    ];
    exportToCsv(`support_tickets_${new Date().toISOString().slice(0, 10)}.csv`, columns, tickets);
  };

  const exportCurrentChatCsv = () => {
    if (!activeTicket) return;
    const msgs = activeTicket.messages || [];
    const columns = [
      { key: 'id', label: 'Message ID' },
      { label: 'Sender', accessor: m => m.sender?.role === 'ADMIN' ? 'Admin' : (m.sender?.name || 'Client') },
      { key: 'content', label: 'Message' },
      { label: 'Sent At', accessor: m => new Date(m.createdAt).toISOString() }
    ];
    exportToCsv(`chat_transcript_${activeTicket.id.slice(0, 8)}.csv`, columns, msgs);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Awaiting Admin</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-blue/10 text-accent-blue border border-accent-blue/20">Chat Active</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-text-secondary border border-white/10">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-text-tertiary">{status}</span>;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare size={22} className="text-accent-blue" />
            Global Support Tickets & Live Chat
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Accept client chat requests, initiate direct chats with any user, and respond in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-accent-blue/20"
          >
            <Plus size={14} />
            Start Direct Chat
          </button>

          <button
            onClick={exportAllTicketsCsv}
            disabled={tickets.length === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            Export Tickets CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search by subject, name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-border-subtle rounded-lg pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-secondary shrink-0" />
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-[#111] border border-border-subtle rounded-lg px-3.5 py-2 text-xs font-medium text-white hover:border-white/20 transition-colors min-w-[150px] text-left flex justify-between items-center"
            >
              <span>
                {statusFilter === 'ALL' ? 'All Statuses' : 
                 statusFilter === 'OPEN' ? 'Awaiting Approval' : 
                 statusFilter === 'IN_PROGRESS' ? 'Active Chat' : 
                 statusFilter === 'RESOLVED' ? 'Resolved' : 
                 'Closed'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 ml-2 opacity-60 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-1 w-full bg-[#111] border border-border-subtle rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                  {[
                    { value: 'ALL', label: 'All Statuses' },
                    { value: 'OPEN', label: 'Awaiting Approval' },
                    { value: 'IN_PROGRESS', label: 'Active Chat' },
                    { value: 'RESOLVED', label: 'Resolved' },
                    { value: 'CLOSED', label: 'Closed' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-white/5 transition-colors ${statusFilter === opt.value ? 'text-accent-blue bg-accent-blue/5 font-semibold' : 'text-text-secondary hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Ticket Table & Live Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Side: Ticket List */}
        <div className={`bg-[#111] border border-border-subtle rounded-xl overflow-hidden ${activeTicket ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Ticket Queue ({tickets.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400 text-xs">Failed to load support tickets.</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-text-secondary text-xs">No tickets match your filter criteria.</div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[650px] overflow-y-auto">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 hover:bg-white/[0.03] transition-colors cursor-pointer flex flex-col gap-2 ${
                    activeTicket?.id === ticket.id ? 'bg-accent-blue/5 border-l-2 border-accent-blue' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-tertiary">#{ticket.id.slice(-6).toUpperCase()}</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                      <Clock size={11} /> {format(new Date(ticket.updatedAt), 'MMM d, HH:mm')}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white truncate">{ticket.subject}</h3>
                  <p className="text-xs text-text-secondary line-clamp-1">{ticket.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-white/5">
                    <span>{ticket.user?.name || ticket.user?.email}</span>
                    <span className="text-accent-blue font-medium">{ticket.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Live Support Chat & Resolution Panel */}
        {activeTicket && (
          <div className="lg:col-span-7 bg-[#111] border border-border-subtle rounded-xl flex flex-col h-[650px] overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    {activeTicket.subject}
                    {getStatusBadge(activeTicket.status)}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Client: {activeTicket.user?.name || 'User'} ({activeTicket.user?.email})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportCurrentChatCsv}
                  title="Export Transcript CSV"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-tertiary hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Action Bar (Accept & Start Chat or Change Status) */}
            <div className="p-3 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {activeTicket.status === 'OPEN' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                    <AlertCircle size={14} /> Ticket awaiting staff response.
                  </span>
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    disabled={statusUpdating}
                    className="px-4 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={13} />
                    Accept & Start Chat
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-text-secondary">Status Controls:</span>
                  <div className="flex items-center gap-2">
                    {activeTicket.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        disabled={statusUpdating}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 transition-colors"
                      >
                        Re-Open Chat
                      </button>
                    )}
                    {activeTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleStatusChange('RESOLVED')}
                        disabled={statusUpdating}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {activeTicket.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleStatusChange('CLOSED')}
                        disabled={statusUpdating}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/10 text-text-secondary hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-colors"
                      >
                        Close & Lock
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Initial Ticket Ingestion Message */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="font-semibold text-white">{activeTicket.user?.name || 'Client'} (Initial Request)</span>
                  <span>{format(new Date(activeTicket.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {activeTicket.message}
                </p>
              </div>

              {/* Threaded Replies */}
              {(activeTicket.messages || []).map((msg) => {
                const isAdmin = msg.sender?.role === 'ADMIN' || msg.senderRole === 'ADMIN';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                      <span>{isAdmin ? 'Administrator (You)' : (activeTicket.user?.name || 'Client')}</span>
                      <span>•</span>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isAdmin
                          ? 'bg-accent-blue text-white rounded-br-sm'
                          : 'bg-white/10 text-white rounded-bl-sm border border-white/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Composer */}
            <div className="p-3 border-t border-white/5 bg-black/40 shrink-0">
              {activeTicket.status === 'CLOSED' ? (
                <div className="p-3 rounded-lg bg-white/5 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                  <Lock size={14} /> This conversation is closed. Re-open to send messages.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply to client..."
                    className="flex-1 bg-background border border-border-subtle rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Reply
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Start New Direct Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Start Direct Client Chat</h3>
                  <p className="text-xs text-text-secondary">Initiate a live support conversation with any registered tenant.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-text-tertiary hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDirectChat} className="p-5 space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Select Recipient Tenant
                </label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg text-xs">
                    <div>
                      <span className="font-semibold text-white block">{selectedUser.name || 'Tenant User'}</span>
                      <span className="text-text-tertiary">{selectedUser.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-xs text-accent-blue hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search tenant by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                    />
                    {isSearchingUser && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-text-tertiary" />
                      </div>
                    )}

                    {/* Results dropdown */}
                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#151515] border border-white/10 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-white/5">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearchQuery('');
                              setUserSearchResults([]);
                            }}
                            className="w-full text-left p-2.5 hover:bg-white/5 transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-medium text-white block">{u.name || 'User'}</span>
                              <span className="text-text-tertiary text-[11px]">{u.email}</span>
                            </div>
                            <span className="text-[10px] text-accent-blue font-semibold uppercase">Select</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Conversation Subject / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account Assistance, Workflow Optimization, Storage Quota Review"
                  value={newChatSubject}
                  onChange={(e) => setNewChatSubject(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                  Initial Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your official message to the client..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-lg p-3 text-xs text-white focus:outline-none focus:border-accent-blue resize-none leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 border border-border-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !selectedUser || !newChatMessage.trim()}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-accent-blue/20"
                >
                  {isCreatingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send & Open Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
