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
  Plus,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToCsv } from '@/lib/csvExport';

export default function GlobalSupportTicketsClient() {
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

  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/support`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');

      setActiveTicket(prev => ({ ...prev, status: newStatus }));
      mutate();
      mutateActiveTicket();
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Error updating status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() })
      });

      if (!res.ok) throw new Error('Failed to send reply');

      const newMsg = await res.json();
      setActiveTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg]
      }));

      setReplyText('');
      mutateActiveTicket();
      mutate();
      toast.success('Reply sent to client');
    } catch (err) {
      toast.error('Error sending reply: ' + err.message);
    } finally {
      setReplying(false);
    }
  };

  const handleCreateDirectChat = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newChatMessage.trim()) {
      toast.error('Please select a tenant and type a message');
      return;
    }

    setIsCreatingChat(true);
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          subject: newChatSubject.trim() || 'Official Administrative Inquiry',
          message: newChatMessage.trim(),
          type: 'DIRECT_CHAT'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start chat');

      toast.success('Direct chat initiated with client!');
      setIsNewChatModalOpen(false);
      setSelectedUser(null);
      setNewChatSubject('');
      setNewChatMessage('');
      
      mutate();
      if (data.ticket) {
        setActiveTicket(data.ticket);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to initiate conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-text-tertiary border border-white/10">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/50">{status}</span>;
    }
  };

  const exportTicketsToCsv = () => {
    const columns = [
      { key: 'id', label: 'Ticket ID' },
      { label: 'Client Name', accessor: (t) => t.user?.name || 'N/A' },
      { label: 'Client Email', accessor: (t) => t.user?.email || 'N/A' },
      { key: 'subject', label: 'Subject' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'message', label: 'Initial Message' },
      { label: 'Created At', accessor: (t) => format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss') }
    ];
    exportToCsv(`support_tickets_${new Date().toISOString().slice(0, 10)}.csv`, columns, tickets);
  };

  return (
    <div className="space-y-6">
      {/* Action and Filter Toolbar */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg shadow-black/20">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search tickets by user, email, subject, or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Custom Headless UI Dropdown for Status Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3.5 py-2 rounded-lg bg-background border border-border-subtle text-xs sm:text-sm text-white flex items-center gap-2 hover:border-white/20 transition-colors focus:outline-none"
            >
              <Filter size={14} className="text-text-secondary" />
              <span>Status: <strong className="font-semibold text-accent-blue capitalize">{statusFilter.toLowerCase().replace('_', ' ')}</strong></span>
              <ChevronDown size={14} className="text-text-secondary ml-1" />
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-44 bg-[#151515] border border-white/10 rounded-lg shadow-xl z-50 py-1 divide-y divide-white/5">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'OPEN', label: 'Open' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'RESOLVED', label: 'Resolved' },
                    { id: 'CLOSED', label: 'Closed' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-white hover:bg-accent-blue hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span>{option.label}</span>
                      {statusFilter === option.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export to CSV */}
          <button
            onClick={exportTicketsToCsv}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-medium border border-border-subtle flex items-center gap-1.5 transition-colors"
            title="Download CSV report"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Start Direct Live Chat Button */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-accent-blue/20"
          >
            <Plus size={15} />
            <span>Start Direct Chat</span>
          </button>
        </div>
      </div>

      {/* Main Support Center Workspace (Split Panel Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left List Panel: Ticket Feed */}
        <div className="lg:col-span-5 bg-[#111] border border-border-subtle rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <MessageSquare size={14} className="text-accent-blue" />
              Incoming Inquiries ({tickets.length})
            </span>
            <button 
              onClick={() => mutate()} 
              className="text-text-tertiary hover:text-white p-1 rounded-md transition-colors"
              title="Refresh tickets"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {isLoading && tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-secondary">
              <Loader2 className="animate-spin text-accent-blue mb-3" size={24} />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare size={36} className="text-text-tertiary mb-3 opacity-50" />
              <h4 className="text-sm font-semibold text-white mb-1">No Tickets Found</h4>
              <p className="text-xs text-text-secondary max-w-[220px]">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'No tickets match your active filter criteria.' 
                  : 'All client requests have been cleared.'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {tickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-accent-blue/10 border-l-4 border-accent-blue' 
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-white truncate max-w-[240px]">
                        {ticket.subject}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>

                    <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed">
                      {ticket.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1 text-white/70">
                        <User size={11} className="text-accent-blue" />
                        <strong className="font-medium truncate max-w-[140px]">{ticket.user?.name || ticket.user?.email || 'User'}</strong>
                      </span>
                      <span>{format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Live Support Chat Stream */}
        {!activeTicket ? (
          <div className="lg:col-span-7 bg-[#111] border border-border-subtle rounded-xl flex flex-col items-center justify-center p-12 text-center">
            <MessageSquare size={48} className="text-text-tertiary opacity-40 mb-4" />
            <h3 className="text-base font-bold text-white mb-1">Select a Conversation</h3>
            <p className="text-xs text-text-secondary max-w-sm">
              Click any ticket on the left to read full details, adjust resolution status, or send immediate official replies.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-[#111] border border-border-subtle rounded-xl flex flex-col overflow-hidden">
            {/* Conversation Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{activeTicket.subject}</h3>
                  {getStatusBadge(activeTicket.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                  <span className="text-white font-medium">{activeTicket.user?.name || 'Client'}</span>
                  <span>({activeTicket.user?.email})</span>
                  <span>•</span>
                  <span>Type: <strong className="text-text-secondary">{activeTicket.type}</strong></span>
                </div>
              </div>

              {/* Status Update Quick Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-text-tertiary mr-1">Status:</span>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating || activeTicket.status === st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer ${
                      activeTicket.status === st
                        ? 'bg-accent-blue text-white shadow-sm'
                        : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Stream View */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[500px]">
              {/* Initial Client Inquiry */}
              <div className="flex flex-col gap-1 max-w-[85%] mr-auto items-start">
                <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary px-1">
                  <span className="font-semibold text-text-secondary">{activeTicket.user?.name || 'Client'}</span>
                  <span>•</span>
                  <span>{format(new Date(activeTicket.createdAt), 'MMM dd, HH:mm')}</span>
                </div>
                <div className="p-3.5 bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tl-sm text-xs sm:text-sm text-white shadow-md leading-relaxed whitespace-pre-wrap">
                  {activeTicket.message}
                </div>
              </div>

              {/* Threaded Replies & Messages */}
              {(activeTicket.messages || []).map((msg) => {
                const isAdmin = msg.senderId !== activeTicket.userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary px-1">
                      <span className={isAdmin ? 'font-semibold text-accent-blue' : 'font-semibold text-text-secondary'}>
                        {isAdmin ? 'Administrator (You)' : (activeTicket.user?.name || 'Client')}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isAdmin
                          ? 'bg-accent-blue text-white rounded-tr-sm shadow-md shadow-accent-blue/10'
                          : 'bg-[#1a1a1a] border border-white/10 text-white rounded-tl-sm shadow-md'
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
                    className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
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
                className="text-text-tertiary hover:text-white p-1 rounded-lg cursor-pointer"
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
                      className="text-xs text-accent-blue hover:underline cursor-pointer"
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
                            className="w-full text-left p-2.5 hover:bg-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer"
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
                  className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 border border-border-subtle transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !selectedUser || !newChatMessage.trim()}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-accent-blue/20 cursor-pointer"
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
