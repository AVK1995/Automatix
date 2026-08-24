'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Minimize2, 
  Maximize2, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Clock,
  CheckCircle2,
  Lock,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'live_support'

  // AI Assistant Messages
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am the Automatix Assistant. I can help you with connections, workflows, triggers, actions, the calendar, or your storage bucket. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live Admin Support State
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [supportInput, setSupportInput] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [unreadAdminMsg, setUnreadAdminMsg] = useState(null);
  const [isPopupDismissed, setIsPopupDismissed] = useState(false);

  const messagesEndRef = useRef(null);
  const supportEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    if (activeTab === 'assistant') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTicket, isOpen, isMinimized, activeTab]);

  // Poll for live support tickets and admin messages
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        const ticketList = Array.isArray(data) ? data : [];
        setTickets(ticketList);

        // Find the latest active ticket with admin replies
        const activeT = ticketList.find(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN') || ticketList[0];
        if (activeT) {
          setActiveTicket(activeT);

          // Check for latest message from admin
          if (activeT.messages && activeT.messages.length > 0) {
            const lastMsg = activeT.messages[activeT.messages.length - 1];
            // If the last message is from staff/admin (i.e. sender is not the ticket owner, or staff flag)
            if (lastMsg.senderId !== activeT.userId) {
              setUnreadAdminMsg({
                ticketId: activeT.id,
                subject: activeT.subject,
                content: lastMsg.content,
                createdAt: lastMsg.createdAt
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Chatbot poll error:', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Listen for custom event from Notification Bell
  useEffect(() => {
    const handleOpenSupport = (e) => {
      setIsOpen(true);
      setIsMinimized(false);
      setActiveTab('live_support');
      setIsPopupDismissed(true);
      fetchTickets();
    };

    window.addEventListener('open-chatbot-support', handleOpenSupport);
    return () => window.removeEventListener('open-chatbot-support', handleOpenSupport);
  }, []);

  const handleSubmitAssistant = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch response');

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I am ready to help. If you have an urgent inquiry or technical question, please connect with our administrative team on Live Support. [ACTION:RAISE_TICKET]' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportInput.trim() || !activeTicket || isSendingSupport) return;

    setIsSendingSupport(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: supportInput.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const newMsg = await res.json();
      setActiveTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), newMsg]
      }));
      setSupportInput('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingSupport(false);
    }
  };

  const openLiveSupportChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setActiveTab('live_support');
    setIsPopupDismissed(true);
  };

  return (
    <>
      {/* WhatsApp-Style Floating Message Popup when Chatbot is Closed */}
      {!isOpen && unreadAdminMsg && !isPopupDismissed && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-24 right-6 w-80 bg-[#0f0f0f] border border-emerald-500/30 rounded-2xl shadow-2xl z-50 p-4 cursor-pointer group hover:border-emerald-500/60 transition-all backdrop-blur-xl"
            onClick={openLiveSupportChat}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-white tracking-wide">Administrator</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/20">
                  Live Chat
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopupDismissed(true);
                }}
                className="text-text-tertiary hover:text-white p-1 rounded-full hover:bg-white/5"
              >
                <X size={13} />
              </button>
            </div>

            <p className="text-xs text-white/90 leading-relaxed font-medium line-clamp-2">
              "{unreadAdminMsg.content}"
            </p>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-text-tertiary">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                Click to reply in chat <ArrowRight size={10} />
              </span>
              <span>{new Date(unreadAdminMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating Bot Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => {
              setIsOpen(true);
              setIsPopupDismissed(true);
            }}
            className="relative w-14 h-14 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-accent-blue/90 transition-transform hover:scale-105 group ring-4 ring-black/40"
            aria-label="Open Assistant & Support Chat"
          >
            <Bot size={26} className="group-hover:scale-110 transition-transform" />

            {/* Unread badge indicator */}
            {unreadAdminMsg && !isPopupDismissed && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white items-center justify-center">
                  1
                </span>
              </span>
            )}
          </button>
        </div>
      )}

      {/* Expanded Chatbot Modal */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] bg-[#111] border border-border-subtle rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 overflow-hidden ${isMinimized ? 'h-[60px]' : 'h-[550px]'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-border-subtle bg-white/[0.03] cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${activeTab === 'live_support' ? 'bg-emerald-500' : 'bg-accent-blue'}`}>
                {activeTab === 'live_support' ? <MessageSquare size={17} /> : <Bot size={17} />}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-white">
                  {activeTab === 'live_support' ? 'Live Support Desk' : 'Automatix Assistant'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {activeTab === 'live_support' ? 'Admin Channel Connected' : 'AI Help & Guide'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-text-tertiary">
              <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!isMinimized && (
            <div className="grid grid-cols-2 p-1.5 bg-black/40 border-b border-white/5 gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('assistant')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'assistant'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-text-tertiary hover:text-white'
                }`}
              >
                <Bot size={13} />
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('live_support')}
                className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'live_support'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-text-tertiary hover:text-white'
                }`}
              >
                <MessageSquare size={13} />
                Live Admin Chat
                {unreadAdminMsg && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            </div>
          )}

          {/* Body */}
          {!isMinimized && (
            <>
              {/* TAB 1: AI ASSISTANT */}
              {activeTab === 'assistant' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => {
                      const hasTicketAction = msg.content.includes('[ACTION:RAISE_TICKET]');
                      const cleanContent = msg.content.replace('[ACTION:RAISE_TICKET]', '').trim();
                      
                      return (
                        <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {cleanContent && (
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                              msg.role === 'user' 
                                ? 'bg-accent-blue text-white rounded-br-sm' 
                                : 'bg-white/10 text-white rounded-bl-sm border border-white/5'
                            }`}>
                              {cleanContent}
                            </div>
                          )}
                          {hasTicketAction && (
                            <div className="max-w-[90%] bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-3.5 flex flex-col gap-2 mt-1 shadow-lg shadow-accent-blue/5">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-accent-blue/20 text-accent-blue">
                                  <MessageSquare size={13} />
                                </div>
                                <span className="text-xs font-semibold text-white">Support & Help Desk</span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-normal">
                                Connect directly with an administrator in real time.
                              </p>
                              <button 
                                onClick={() => setActiveTab('live_support')}
                                className="text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-1"
                              >
                                <MessageSquare size={13} />
                                Open Live Chat
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce delay-200"></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Assistant Input */}
                  <div className="p-3 border-t border-border-subtle bg-black/40">
                    <form onSubmit={handleSubmitAssistant} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 bg-background border border-border-subtle rounded-full px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                      />
                      <button 
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center disabled:opacity-50 hover:bg-accent-blue/90 transition-colors shrink-0"
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* TAB 2: LIVE ADMIN CHAT */}
              {activeTab === 'live_support' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/20">
                    {!activeTicket ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                          <MessageSquare size={22} />
                        </div>
                        <h4 className="text-sm font-semibold text-white">No Active Conversation</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Need help from an administrator? Raise a support ticket to start chatting.
                        </p>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push('/dashboard/support');
                          }}
                          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Plus size={13} />
                          Open Support Ticket
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Ticket Banner */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Active Subject:</span>
                            <h4 className="text-xs font-semibold text-white truncate">{activeTicket.subject}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                            activeTicket.status === 'CLOSED' ? 'bg-white/10 text-text-secondary' :
                            activeTicket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-accent-blue/10 text-accent-blue'
                          }`}>
                            {activeTicket.status}
                          </span>
                        </div>

                        {/* Messages Stream */}
                        <div className="space-y-3 pt-1">
                          {(activeTicket.messages || []).map((m) => {
                            const isStaff = m.senderId !== activeTicket.userId;
                            return (
                              <div key={m.id} className={`flex flex-col gap-1 ${isStaff ? 'items-start' : 'items-end'}`}>
                                <div className="flex items-center gap-1.5 px-1">
                                  <span className="text-[10px] font-bold text-text-tertiary uppercase">
                                    {isStaff ? 'Administrator' : 'You'}
                                  </span>
                                  <span className="text-[9px] text-text-tertiary">
                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                  isStaff
                                    ? 'bg-[#181818] border border-emerald-500/30 text-white rounded-bl-sm shadow-md'
                                    : 'bg-accent-blue text-white rounded-br-sm shadow-md'
                                }`}>
                                  {m.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    <div ref={supportEndRef} />
                  </div>

                  {/* Live Support Input */}
                  {activeTicket && activeTicket.status !== 'CLOSED' ? (
                    <div className="p-3 border-t border-border-subtle bg-black/40">
                      <form onSubmit={handleSendSupportMessage} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={supportInput}
                          onChange={e => setSupportInput(e.target.value)}
                          placeholder="Reply to administrator..."
                          className="flex-1 bg-background border border-border-subtle rounded-full px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                        />
                        <button 
                          type="submit"
                          disabled={isSendingSupport || !supportInput.trim()}
                          className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 transition-colors shrink-0 shadow-sm"
                        >
                          {isSendingSupport ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      </form>
                    </div>
                  ) : activeTicket?.status === 'CLOSED' ? (
                    <div className="p-3 border-t border-border-subtle bg-black/40 text-center">
                      <p className="text-[11px] text-text-secondary">
                        This conversation has been closed by admin.
                      </p>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dashboard/support');
                        }}
                        className="text-xs text-accent-blue font-semibold hover:underline mt-1 inline-block"
                      >
                        Raise a new ticket to continue &rarr;
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
