'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';

export default function RegisterForm({ isFull, isEnabled }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFull || !isEnabled) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-border-subtle rounded-2xl p-8 shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none"></div>
      
      <div className="flex flex-col items-center mb-8 relative">
        <Logo size={48} className="mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-sm text-text-secondary">Start automating your workflows today.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {(!isEnabled || isFull) ? (
        <div className="text-center p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <p className="text-white font-medium">Waitlist Enabled</p>
          <p className="text-sm text-text-secondary">
            {isFull ? "We have reached our maximum capacity for early-access users. Please check back later!" : "Self-serve registration is currently disabled."}
          </p>
          <Link href="/" className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md transition-colors">
            Return Home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-text-tertiary" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-text-tertiary" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-text-tertiary" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-white/90 text-black font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-text-secondary relative z-10">
        Already have an account?{' '}
        <Link href="/login" className="text-white hover:text-accent-blue font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
