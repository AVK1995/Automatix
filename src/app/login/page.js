'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@automatix.local');
  const [password, setPassword] = useState('admin');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border-subtle rounded-sm p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-6 text-center">Automatix Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-foreground text-background font-medium text-sm py-2 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-xs text-text-secondary text-center">
          Default Admin: admin@automatix.local / admin
        </p>
      </div>
    </div>
  );
}
