'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, Maximize2, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am the Automatix Assistant. I can help you with connections, workflows, triggers, actions, the calendar, or your storage bucket. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = async (e) => {
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
        content: 'I am ready to help. If you have an urgent inquiry or technical question, please open a support ticket with our administrative team. [ACTION:RAISE_TICKET]' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-xl hover:bg-accent-blue/90 transition-transform hover:scale-105 z-50 group"
        aria-label="Open Assistant Chat"
      >
        <Bot size={26} className="group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-2rem)] bg-[#111] border border-border-subtle rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 ${isMinimized ? 'h-[60px]' : 'h-[520px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-white/5 rounded-t-xl cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Automatix Assistant</h3>
            <p className="text-[10px] text-accent-blue font-medium">Online Help</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white transition-colors p-1">
            {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white transition-colors p-1">
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
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
                        Submit a formal ticket to connect directly with an administrator.
                      </p>
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dashboard/support');
                        }}
                        className="text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-1"
                      >
                        <Plus size={13} />
                        Open Support Desk
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

          {/* Input */}
          <div className="p-3 border-t border-border-subtle bg-black/40 rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-background border border-border-subtle rounded-full px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-full bg-accent-blue text-white flex items-center justify-center disabled:opacity-50 hover:bg-accent-blue/90 transition-colors shrink-0"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
