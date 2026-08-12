'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveConnection } from '@/actions/connections';
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OAuthAuthorizePage() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || 'Unknown';
  
  const [step, setStep] = useState('naming'); // naming, redirecting, auth, success
  const [loading, setLoading] = useState(false);
  const [connectionName, setConnectionName] = useState('');

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const startOAuth = (e) => {
    e.preventDefault();
    if (!connectionName.trim()) return;
    setStep('redirecting');
    
    // Simulate redirecting to the 3rd party OAuth provider
    setTimeout(() => {
      setStep('auth');
    }, 1500);
  };

  const handleAllow = async () => {
    setLoading(true);
    try {
      // For Calendly, we can't use a dummy token because we explicitly verify it.
      // So if the provider is Calendly, we should just show an error instructing them to use the builder.
      if (provider.toLowerCase() === 'calendly') {
        alert('For Calendly, please connect via the Workflow Builder to securely enter your Personal Access Token.');
        setLoading(false);
        return;
      }

      const result = await saveConnection(provider, connectionName, `oauth_token_${Math.random().toString(36).substr(2, 9)}`);
      
      if (result && !result.success) {
        alert(result.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      setStep('success');
      
      // Notify parent window and close
      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider }, '*');
          window.close();
        } else {
          // Fallback if not opened in a popup
          window.location.href = '/dashboard/connections';
        }
      }, 1500);

    } catch (error) {
      console.error(error);
      setLoading(false);
      alert('Authentication failed.');
    }
  };

  if (step === 'naming') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-border-subtle p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full"
        >
          <h1 className="text-xl font-bold text-foreground mb-2">Connect {capitalize(provider)}</h1>
          <p className="text-sm text-text-secondary mb-6">Give this connection a name to identify it later.</p>
          
          <form onSubmit={startOAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Connection Name</label>
              <input 
                type="text" 
                autoFocus
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder="e.g. Work Calendly, Personal Slack..."
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={!connectionName.trim()}
              className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              Continue to {capitalize(provider)}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (step === 'redirecting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin mb-4" />
        <h1 className="text-lg font-medium text-foreground">Connecting to {capitalize(provider)}...</h1>
        <p className="text-sm text-text-secondary mt-2">Please wait while we redirect you.</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border-subtle p-8 rounded-xl shadow-2xl flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Successfully Connected!</h1>
          <p className="text-sm text-text-secondary mb-6">Your {capitalize(provider)} account is now linked to Automatix.</p>
          <p className="text-xs text-text-secondary">This window will close automatically...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border-subtle p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full"
      >
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#0a0a0a] border border-border-subtle rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <ArrowRight className="w-5 h-5 text-text-secondary" />
          <div className="w-12 h-12 bg-[#0a0a0a] border border-border-subtle rounded-xl flex items-center justify-center text-accent-blue font-bold">
            {provider.charAt(0).toUpperCase()}
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground text-center mb-2">Authorize Automatix</h1>
        <p className="text-sm text-text-secondary text-center mb-8">Automatix is requesting access to your {capitalize(provider)} account.</p>

        <div className="bg-[#0a0a0a] border border-border-subtle rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Permissions Requested:
          </h3>
          <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
            <li>Read your profile information</li>
            <li>Manage webhooks and events</li>
            <li>Access basic account data</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleAllow}
            disabled={loading}
            className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Allow Access'}
          </button>
          <button 
            onClick={() => window.close()}
            className="w-full bg-transparent border border-border-subtle hover:bg-white/5 text-foreground font-medium py-2.5 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-[10px] text-center text-text-secondary mt-6">
          By clicking Allow, you agree to the Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}
