'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token || !email) {
    return <div className="text-red-400 text-sm text-center">Invalid setup link. Missing token or email in URL.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to setup password');
      
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-accent-blue mb-2">Password Set Successfully!</h2>
        <p className="text-sm text-text-secondary">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Account Email</label>
        <input 
          type="email" 
          value={email}
          disabled
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-text-secondary cursor-not-allowed opacity-70"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">New Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-violet"
          required
          minLength={8}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Confirm Password</label>
        <input 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-violet"
          required
          minLength={8}
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full mt-4 bg-accent-violet hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
      >
        {loading ? 'Securing Account...' : 'Set Password & Access Account'}
      </button>
    </form>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border-subtle rounded-sm p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-6 text-center">Complete Account Setup</h1>
        <Suspense fallback={<div className="text-sm text-text-secondary text-center">Loading...</div>}>
          <SetupPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
