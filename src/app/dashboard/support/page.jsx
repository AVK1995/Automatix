'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, X, Send, Loader2, Lock, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import Select from '@/components/ui/Select';

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  
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
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      setTickets(data);
      if (data?.length > 0 && !activeTicket) {
        setActiveTicket(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
            <MessageSquare size={22} className="text-accent-blue" />
            Support & Help Desk
          </h1>
          <p className="text-sm text-text-secondary">
            Submit formal support inquiries or connect directly with our administration team.
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white text-xs font-semibold rounded-lg hover:bg-accent-blue/90 transition-colors shadow-lg shadow-accent-blue/10 shrink-0"
        >
          <Plus size={15} /> Raise Support Ticket
        </button>
      </div>

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
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setActiveTicket(ticket);
                    setIsCreating(false);
                  }}
                  className={`w-full text-left p-4 hover:bg-white/[0.03] transition-colors flex flex-col gap-1.5 ${activeTicket?.id === ticket.id && !isCreating ? 'bg-accent-blue/5 border-l-2 border-accent-blue' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'OPEN' ? 'Awaiting Admin' : ticket.status === 'IN_PROGRESS' ? 'Active Chat' : ticket.status}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{ticket.subject}</h3>
                  <p className="text-xs text-text-secondary truncate">{ticket.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Conversation Window or Create Form */}
        <div className="lg:col-span-8 bg-[#111] border border-border-subtle rounded-xl flex flex-col h-[600px] overflow-hidden shadow-2xl">
          {isCreating ? (
            <div className="p-6 h-full overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-white">Raise New Support Ticket</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Submit your request. Once accepted by an admin, real-time chat will be enabled.</p>
                </div>
                <button onClick={() => setIsCreating(false)} className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/5 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Inquiry Category</label>
                  <Select
                    value={newType}
                    onChange={val => setNewType(val)}
                    options={[
                      { value: 'GENERAL', label: 'General Support & Assistance' },
                      { value: 'BILLING', label: 'Billing, Plans & Quota Upgrades' },
                      { value: 'TECHNICAL', label: 'Technical Issue / Bug Report' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Subject</label>
                  <input 
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="e.g. Need assistance with Meta webhook trigger"
                    required
                    className="w-full bg-background border border-border-subtle rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Detailed Description</label>
                  <textarea 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Describe what issue you are experiencing or what you need assistance with..."
                    required
                    rows={6}
                    className="w-full bg-background border border-border-subtle rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Support Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            <>
              {/* Active Ticket Header */}
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getStatusColor(activeTicket.status)}`}>
                      {activeTicket.status === 'OPEN' ? 'Waiting for Admin Approval' : activeTicket.status === 'IN_PROGRESS' ? 'Live Chat Active' : activeTicket.status}
                    </span>
                    <span className="text-xs text-text-tertiary font-mono">#{activeTicket.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-white mt-1">{activeTicket.subject}</h2>
                </div>
              </div>

              {/* Status Alert Banner */}
              {activeTicket.status === 'OPEN' && (
                <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400 flex items-center gap-2 shrink-0">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Ticket submitted. Waiting for an administrator to review and accept the chat session.</span>
                </div>
              )}

              {activeTicket.status === 'CLOSED' && (
                <div className="p-3 bg-white/5 border-b border-white/10 text-xs text-text-secondary flex items-center gap-2 shrink-0">
                  <Lock size={15} className="shrink-0" />
                  <span>This support inquiry has been closed by an administrator. To start a new conversation, please raise a new ticket.</span>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Initial Description */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-text-tertiary mb-1">
                    <span className="font-semibold text-white">Your Initial Request</span>
                    <span>{new Date(activeTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {activeTicket.message}
                  </p>
                </div>

                {/* Conversation Stream */}
                {(activeTicket.messages || []).map(msg => {
                  const isAdmin = msg.senderRole === 'ADMIN' || msg.sender?.role === 'ADMIN';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col gap-1 max-w-[85%] ${
                        isAdmin ? 'mr-auto items-start' : 'ml-auto items-end'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                        <span>{isAdmin ? 'Administrator' : 'You'}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isAdmin 
                          ? 'bg-white/10 text-white rounded-bl-sm border border-white/5' 
                          : 'bg-accent-blue text-white rounded-br-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-white/5 bg-black/40 shrink-0">
                {activeTicket.status === 'CLOSED' ? (
                  <div className="p-3 rounded-lg bg-white/5 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                    <Lock size={14} /> Conversation closed. Click "Raise Support Ticket" to start a new chat.
                  </div>
                ) : activeTicket.status === 'OPEN' ? (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
                    <Clock size={14} /> Chat will be active as soon as an administrator accepts the request.
                  </div>
                ) : (
                  <form onSubmit={handleReply} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-1 bg-background border border-border-subtle rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
                    />
                    <button 
                      type="submit" 
                      disabled={replying || !replyText.trim()}
                      className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <MessageSquare size={32} className="text-text-tertiary mb-3" />
              <p className="text-white font-medium text-sm">Select a ticket</p>
              <p className="text-text-tertiary text-xs mt-1">Choose a support ticket from the list or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
