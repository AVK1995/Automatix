'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid credentials');
      setLoading(false);
    } else {
      router.push('/admin'); // Middleware will catch non-admins and redirect to /workflows
      router.refresh();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex items-center justify-center p-4">
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent-violet/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
             <div className="w-12 h-12 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-2xl flex items-center justify-center shadow-lg mx-auto hover:scale-105 transition-transform">
               <span className="font-bold text-white text-xl">A</span>
             </div>
          </Link>
          <h1 className="text-3xl font-semibold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Welcome back</h1>
          <p className="text-text-secondary text-sm mt-2">Enter your details to access your workspace</p>
        </div>

        <div className="bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle inner highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 mt-2 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
