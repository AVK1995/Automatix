'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType, subject: newSubject, message: newMessage })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      toast.success('Ticket created successfully');
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
    if (!replyText || !activeTicket) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText })
      });
      if (!res.ok) throw new Error('Failed to send reply');

      const newMsg = await res.json();
      
      // Update local state
      setActiveTicket({
        ...activeTicket,
        messages: [...activeTicket.messages, newMsg]
      });
      setReplyText('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReplying(false);
    }
  };

  const handleCloseTicket = async (id) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (!res.ok) throw new Error('Failed to close ticket');
      
      toast.success('Ticket closed');
      if (activeTicket?.id === id) {
        setActiveTicket({ ...activeTicket, status: 'CLOSED' });
      }
      fetchTickets();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'CLOSED': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'DISMISSED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-white/70 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Support Tickets</h1>
          <p className="text-sm text-text-secondary">Get help and track your ongoing inquiries.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="flex gap-6 h-full min-h-0">
        {/* Ticket List */}
        <div className="w-1/3 bg-[#0d0d0d] border border-white/5 rounded-xl overflow-y-auto flex flex-col">
          {tickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={32} className="text-white/20 mb-4" />
              <p className="text-white/70 font-medium">No tickets yet</p>
              <p className="text-white/40 text-xs mt-1">Need help? Create a new ticket.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket)}
                  className={`w-full text-left p-5 hover:bg-white/[0.02] transition-colors ${activeTicket?.id === ticket.id ? 'bg-white/[0.04]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium tracking-wider ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1 truncate">{ticket.subject}</h3>
                  <p className="text-xs text-text-secondary truncate">{ticket.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail / Conversation */}
        <div className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-xl flex flex-col relative overflow-hidden">
          {isCreating ? (
            <div className="p-8 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
                <button onClick={() => setIsCreating(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue"
                  >
                    <option value="GENERAL">General Support</option>
                    <option value="BILLING">Billing & Upgrade</option>
                    <option value="TECHNICAL">Technical Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Subject</label>
                  <input 
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Message</label>
                  <textarea 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Provide detailed information to help us assist you faster..."
                    required
                    rows={6}
                    className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-accent-blue text-white text-sm font-semibold rounded-lg hover:bg-accent-blue/90 disabled:opacity-50">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.01] shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium tracking-wider ${getStatusColor(activeTicket.status)}`}>
                      {activeTicket.status}
                    </span>
                    <span className="text-xs text-text-tertiary">Ticket #{activeTicket.id.slice(-6).toUpperCase()}</span>
                  </div>
                  {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'DISMISSED' && (
                    <button 
                      onClick={() => handleCloseTicket(activeTicket.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-md hover:bg-red-400/10 transition-colors"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{activeTicket.subject}</h2>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeTicket.messages.map((msg, i) => {
                  const isAdmin = msg.senderId !== session?.user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${
                        isAdmin 
                          ? 'bg-white/10 text-white rounded-tl-sm' 
                          : 'bg-accent-blue text-white rounded-tr-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-80">{isAdmin ? 'Automatix Support' : 'You'}</span>
                          <span className="text-[10px] opacity-60 ml-4">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'DISMISSED' ? (
                <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
                  <form onSubmit={handleReply} className="flex gap-3">
                    <input 
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue"
                    />
                    <button 
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
                    >
                      {replying ? <Loader2 size={16} className="animate-spin" /> : 'Reply'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-white/5 bg-black/20 text-center shrink-0">
                  <p className="text-sm text-text-tertiary">This ticket is closed and cannot receive new replies.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/30">
              <MessageSquare size={48} className="mb-4" />
              <p className="font-medium text-lg text-white/50">Select a ticket</p>
              <p className="text-sm">Choose a ticket from the list to view its details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
