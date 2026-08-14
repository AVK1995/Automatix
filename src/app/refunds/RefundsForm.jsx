'use client';

import { useState } from 'react';
import { submitRefundRequest } from '@/actions/support';
import { Loader2, CheckCircle } from 'lucide-react';

export default function RefundsForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await submitRefundRequest(subject, message);
    
    if (res.success) {
      setIsSuccess(true);
    } else {
      setError(res.error || 'Failed to submit request.');
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
        <p className="text-text-secondary">
          Your refund request has been sent securely to our admin team. We will review your case and contact you via your registered account email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Subject / Reason</label>
        <input 
          type="text" 
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Accidental renewal, duplicate charge"
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Detailed Explanation</label>
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please provide any relevant details, dates, or context..."
          className="w-full h-32 resize-none bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all custom-scrollbar"
          required
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
      
      <p className="text-xs text-text-tertiary text-center mt-4">
        Your email address is automatically collected from your logged-in session.
      </p>
    </form>
  );
}
