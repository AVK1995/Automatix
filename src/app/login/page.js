'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';
import Loader from '@/components/Loader';
import Footer from '@/components/ui/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid credentials');
      setLoading(false);
    } else {
      setIsSuccess(true);
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const destination = sessionData?.user?.role === 'ADMIN' ? '/admin' : '/dashboard';
        setTimeout(() => {
          window.location.href = destination;
        }, 500);
      } catch {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }
      
      setResetSuccess(data.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (isSuccess) {
    return <Loader fullScreen />;
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex items-center justify-center p-4">
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent-violet/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center">
              <Link href="/" className="inline-block mb-6">
                 <Logo size={48} className="justify-center mx-auto" />
              </Link>
              <h1 className="text-3xl font-semibold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Welcome back</h1>
              <p className="text-text-secondary text-sm mt-2">Enter your details to access your workspace</p>
            </div>

            <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              {/* Subtle inner highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

              {isForgotPassword ? (
                <form onSubmit={handleForgotSubmit} className="space-y-5" noValidate>
                  <div className="mb-2">
                    <p className="text-sm text-text-secondary">Enter your email address and we'll send you a link to reset your password.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">Email address</label>
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>

                  {resetError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg text-center overflow-hidden">
                      {resetError}
                    </div>
                  )}
                  {resetSuccess && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-2 rounded-lg text-center overflow-hidden">
                      {resetSuccess}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      type="submit" 
                      disabled={resetLoading}
                      className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full text-text-secondary text-sm hover:text-white transition-colors py-2"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">Email address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1 pr-1">
                      <label className="block text-xs font-medium text-white/70">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-accent-violet hover:text-accent-violet/80 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg text-center overflow-hidden">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-2 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              )}
            </div>
          </div>
          
      <div className="absolute bottom-0 w-full z-20">
        <Footer />
      </div>
    </div>
  );
}
