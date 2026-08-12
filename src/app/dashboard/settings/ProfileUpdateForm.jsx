'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateProfile } from './actions';
import { Check, Loader2 } from 'lucide-react';

export default function ProfileUpdateForm({ user }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await updateProfile({ name, phone, address });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
        <input 
          type="text" 
          value={user.email}
          disabled
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-text-secondary opacity-70 cursor-not-allowed"
        />
        <p className="text-[10px] text-text-secondary mt-1">Email address is managed by your administrator.</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Phone Number</label>
        <input 
          type="tel" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 890"
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Address</label>
        <textarea 
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Automation St, Cloud City"
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue transition-colors resize-none"
        />
      </div>
      <button 
        type="submit"
        disabled={status === 'loading'}
        className="bg-accent-blue hover:opacity-90 disabled:opacity-70 text-white px-4 py-2 rounded-sm text-sm font-medium transition-all flex items-center justify-center min-w-[120px]"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved</span>
        ) : (
          'Save Profile'
        )}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-2">Failed to update profile. Please try again.</p>
      )}
    </form>
  );
}
