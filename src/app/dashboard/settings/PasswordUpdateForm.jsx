'use client';

import { useState } from 'react';

export default function PasswordUpdateForm() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setSuccess('Password updated successfully!');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">New Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue"
          placeholder="Enter new password"
          required
          minLength={6}
        />
      </div>

      <div className="flex items-center gap-4">
        <button 
          type="submit"
          disabled={loading || !password}
          className="bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        {success && <span className="text-xs text-green-400 font-medium">{success}</span>}
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    </form>
  );
}
