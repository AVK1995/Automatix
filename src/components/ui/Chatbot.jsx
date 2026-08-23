'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am the Automatix Assistant. I can help you with connections, workflows, triggers, actions, the calendar, or your storage bucket. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-xl hover:bg-accent-blue/90 transition-transform hover:scale-105 z-50"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-[350px] bg-[#111] border border-border-subtle rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 ${isMinimized ? 'h-[60px]' : 'h-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-white/5 rounded-t-xl cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Automatix Assistant</h3>
            <p className="text-[10px] text-accent-blue">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-white transition-colors">
            <X size={18} />
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
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-accent-blue text-white rounded-br-sm' 
                        : 'bg-white/10 text-white rounded-bl-sm'
                    }`}>
                      {cleanContent}
                    </div>
                  )}
                  {hasTicketAction && (
                    <div className="max-w-[85%] bg-accent-violet/20 border border-accent-violet/30 rounded-xl p-3 flex flex-col gap-2 mt-1">
                      <p className="text-xs text-white">Need more help? Open a support ticket.</p>
                      <button 
                        onClick={() => window.location.href = '/dashboard/support'}
                        className="text-xs font-semibold bg-white text-black py-1.5 rounded-lg hover:bg-white/90 transition-colors"
                      >
                        Go to Support Tickets
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
          <div className="p-4 border-t border-border-subtle bg-black/20 rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about triggers, storage..."
                className="flex-1 bg-background border border-border-subtle rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-full bg-accent-blue text-white flex items-center justify-center disabled:opacity-50 hover:bg-accent-blue/90 transition-colors shrink-0"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
