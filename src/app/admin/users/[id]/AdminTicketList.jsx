'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTicketList({ tenantId }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [tenantId]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/admin/users/${tenantId}/tickets`);
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (status) => {
    if (!activeTicket) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success('Status updated');
      setActiveTicket({ ...activeTicket, status });
      fetchTickets(); // Refresh list
    } catch (error) {
      toast.error(error.message);
    } finally {
      setStatusUpdating(false);
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
      <div className="bg-card border border-border-subtle p-6 rounded-sm flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border-subtle p-6 rounded-sm mt-8">
      <h3 className="text-base font-medium text-foreground mb-4">Support Tickets</h3>

      {tickets.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={32} className="text-white/20 mb-4 mx-auto" />
          <p className="text-white/70 font-medium">No tickets from this tenant.</p>
        </div>
      ) : activeTicket ? (
        <div className="bg-[#0d0d0d] border border-white/5 rounded-xl flex flex-col relative h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-white/[0.01] shrink-0 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium tracking-wider ${getStatusColor(activeTicket.status)}`}>
                  {activeTicket.status}
                </span>
                <span className="text-xs text-text-tertiary">Ticket #{activeTicket.id.slice(-6).toUpperCase()}</span>
              </div>
              <h2 className="text-sm font-bold text-white">{activeTicket.subject}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={activeTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                className="bg-[#111] border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
              <button onClick={() => setActiveTicket(null)} className="text-white/40 hover:text-white p-1"><X size={16}/></button>
            </div>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTicket.messages.map((msg, i) => {
              const isAdmin = msg.senderId !== tenantId;
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isAdmin 
                      ? 'bg-accent-blue text-white rounded-tr-sm' 
                      : 'bg-white/10 text-white rounded-tl-sm'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold opacity-80">{isAdmin ? 'You (Admin)' : 'User'}</span>
                      <span className="text-[9px] opacity-60 ml-4">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <div className="p-3 border-t border-white/5 bg-black/20 shrink-0">
            <form onSubmit={handleReply} className="flex gap-2">
              <input 
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
              />
              <button 
                type="submit"
                disabled={replying || !replyText.trim()}
                className="px-4 rounded-lg bg-white text-black font-semibold text-xs hover:bg-white/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
              >
                {replying ? <Loader2 size={14} className="animate-spin" /> : 'Reply'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-white/5 border border-white/5 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setActiveTicket(ticket)}
              className="w-full text-left p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium tracking-wider ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className="text-[10px] text-text-tertiary">
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
  );
}
