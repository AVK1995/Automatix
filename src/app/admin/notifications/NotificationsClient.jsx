'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function NotificationsClient() {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDraft = async () => {
    if (!prompt.trim()) return toast.error('Please enter a topic for the announcement.');
    setIsDrafting(true);
    
    try {
      const res = await fetch('/api/admin/notifications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft');
      
      setSubject(data.subject);
      setBody(data.body);
      toast.success('Draft generated!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDrafting(false);
    }
  };

  const handlePromptSend = () => {
    if (!subject.trim() || !body.trim()) return toast.error('Subject and body cannot be empty.');
    setIsConfirmOpen(true);
  };

  const executeSend = async () => {
    setIsConfirmOpen(false);
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send blast');
      
      toast.success(`Successfully sent to ${data.sentCount} users!`);
      setPrompt('');
      setSubject('');
      setBody('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Sparkles className="text-accent-blue" size={16} /> Draft with Gemini AI
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          Tell Gemini what new features or updates you want to announce. It will draft a user-friendly email for you.
        </p>
        <div className="flex gap-3">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. We just added a new 3-tier storage system and a chatbot knowledgebase..."
            className="flex-1 bg-background border border-border-subtle rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue resize-none h-20"
          />
          <button 
            onClick={handleDraft}
            disabled={isDrafting}
            className="flex flex-col items-center justify-center gap-1 bg-accent-blue text-white rounded-lg px-4 hover:bg-accent-blue/90 transition-colors disabled:opacity-50 min-w-[100px]"
          >
            {isDrafting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span className="text-xs font-medium">{isDrafting ? 'Drafting...' : 'Draft'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Email Editor</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Announcement Subject"
              className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Body</label>
            <textarea 
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Email body goes here..."
              className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue resize-none min-h-[300px]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handlePromptSend}
            disabled={isSending || !subject || !body}
            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded hover:bg-white/90 transition-colors disabled:opacity-50 text-sm font-semibold"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Blast
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSend}
        title="Send Announcement Blast"
        message="Are you sure you want to broadcast this announcement email to all registered platform users?"
        confirmText="Send Blast"
        isDestructive={false}
      />
    </div>
  );
}
