'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, User, Loader2, ArrowRight, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/Logo';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterForm({ isFull, isEnabled }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '';

  const [step, setStep] = useState(1); // 1: Info, 2: OTP Verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isFull || !isEnabled) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      toast.success(`Verification code sent to ${email}`);
      setStep(2);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');

      toast.success(`New verification code sent to ${email}`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete Registration & Auto Login
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp: otp.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Account created and verified! Signing you in...');

      // Auto sign in
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (signInResult?.error) {
        router.push(`/login?registered=true${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`);
      } else {
        router.push(callbackUrl || '/pricing?verified=true');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-border-subtle rounded-2xl p-7 sm:p-8 shadow-2xl relative w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none"></div>
      
      <div className="flex flex-col items-center mb-6 relative">
        <Logo size={44} className="mb-3" />
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5 text-center">
          {step === 1 ? 'Create your account' : 'Verify your email'}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary text-center">
          {step === 1 
            ? 'Start automating your workflows with verified security.' 
            : `We sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center leading-relaxed">
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
      ) : step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-3.5 relative z-10">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 ml-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={15} className="text-text-tertiary" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={15} className="text-text-tertiary" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={15} className="text-text-tertiary" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold rounded-xl py-2.5 text-xs sm:text-sm flex items-center justify-center transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Send Verification Code
                <ArrowRight size={15} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* STEP 2: Enter 6-Digit OTP */
        <form onSubmit={handleVerifyAndRegister} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary ml-1 text-center">
              Enter 6-Digit Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-black/60 border border-accent-blue/40 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-[8px] text-white focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all"
                placeholder="123456"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Change email
            </button>
            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={handleResendOtp}
              className="text-accent-blue hover:text-sky-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold rounded-xl py-2.5 text-xs sm:text-sm flex items-center justify-center transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Verify & Complete Registration</span>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center text-xs text-text-secondary relative z-10 border-t border-white/5 pt-4">
        Already have an account?{' '}
        <Link 
          href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} 
          className="text-white hover:text-accent-blue font-semibold transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
