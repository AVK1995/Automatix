'use client';

import { useState, useEffect } from 'react';
import { getConnectionsByProvider, deleteConnectionById } from '@/actions/connections';
import { Link2, Unlink2, Loader2, CheckCircle2, Plus, HelpCircle } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Select from '@/components/ui/Select';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import SmtpModal from '@/components/connections/SmtpModal';
import LegalConsentModal from '@/components/ui/LegalConsentModal';

export default function ConnectIntegration({ provider, selectedConnectionId, onConnectionSelect }) {
  const providerKey = provider ? provider.toLowerCase() : '';
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [disconnectId, setDisconnectId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [metaSetupMode, setMetaSetupMode] = useState('self-serve');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');

  useEffect(() => {
    checkStatus();
  }, [provider]);

  useEffect(() => {
    if (!loading && selectedConnectionId) {
      const found = connections.find(c => c.id === selectedConnectionId);
      if (!found && onConnectionSelect) {
        onConnectionSelect(null);
      }
    }
  }, [loading, selectedConnectionId, connections]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const statuses = await getConnectionsByProvider(provider);
      setConnections(statuses);
      
      if (statuses.length > 0) {
        if (selectedConnectionId && onConnectionSelect) {
          // Pass the connection data up on load so parent can auto-fill if necessary
          const found = statuses.find(c => c.id === selectedConnectionId);
          if (found) {
            onConnectionSelect(found.id, found, true);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setIsConsentModalOpen(true);
  };

  const handleConsentAccepted = () => {
    setIsConsentModalOpen(false);
    if (providerKey === 'smtp') {
      setIsSmtpModalOpen(true);
      return;
    }
    setIsConnecting(true);
    setError('');
    setApiKey('');
    setAppId('');
    setAppSecret('');
    setPageAccessToken('');
    setConnectionName('');
    setAccountEmail('');
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !connectionName.trim() || !accountEmail.trim()) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // For now we still call saveConnection but we will update it to verify the token
      // We will pass apiKey to a new action or updated action. 
      // We need to import a new action `connectWithApiKey` which we will create next.
      const { connectWithApiKey } = await import('@/actions/connections');
      const result = await connectWithApiKey(provider, connectionName, apiKey, accountEmail);
      
      if (result.success) {
        await checkStatus();
        setIsConnecting(false);
        if (onConnectionSelect) {
          // Note: checkStatus already updates connections, but we might not have it in state here yet
          // So we just pass the ID for now, or if it auto-selects, it will handle it in checkStatus
          onConnectionSelect(result.id);
        }
      } else {
        setError(result.error || 'Failed to connect. Please check your API key.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDisconnect = () => {
    // We no longer globally delete connections from the builder.
    // We simply unselect it from the current step.
    if (onConnectionSelect) {
      onConnectionSelect(null);
    }
  };

  const isOAuthProvider = ['sheets', 'instagram', 'facebook', 'slack', 'gmail'].includes(providerKey);

  const handleConnectOAuth = () => {
    setIsConnecting(true);
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const messageListener = async (event) => {
      if (event.data === 'automatix_oauth_success') {
        window.removeEventListener('message', messageListener);
        await checkStatus();
        setIsConnecting(false);
        // Automatically select the newest connection if possible, checkStatus will handle auto-select
      }
    };
    window.addEventListener('message', messageListener);

    let url = `/api/integrations/google/authorize?provider=${providerKey}`;
    if (appId && appSecret) {
       url += `&app_id=${encodeURIComponent(appId)}&app_secret=${encodeURIComponent(appSecret)}&connection_name=${encodeURIComponent(connectionName)}`;
    }

    window.open(
      url, 
      'OAuth', 
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleMetaSelfServeSetup = async (e) => {
    e.preventDefault();
    if (!appId.trim() || !appSecret.trim() || !pageAccessToken.trim() || !connectionName.trim()) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/integrations/meta/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          appSecret,
          pageAccessToken,
          connectionName,
          providerName: providerKey
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup Meta webhooks');
      }
      
      await checkStatus();
      setIsConnecting(false);
      
      if (onConnectionSelect) {
        onConnectionSelect(data.integrationId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConciergeRequest = async () => {
    setIsSaving(true);
    try {
       const { submitRefundRequest } = await import('@/actions/support');
       const res = await submitRefundRequest(`Concierge Setup: ${providerKey}`, `Client requested a white-glove setup for ${providerKey}. Please contact them for Business Manager access.`);
       if (res.success) {
          alert('Request submitted! Our team will reach out to you shortly.');
          setIsConnecting(false);
       } else {
          setError(res.error || 'Failed to submit request');
       }
    } catch (e) {
       setError('Something went wrong');
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-secondary bg-black/20 p-3 rounded-md border border-white/5">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking connections...
      </div>
    );
  }

  if (isConnecting) {
    if (providerKey === 'sheets' || providerKey === 'slack') {
      return (
        <div className="bg-[#0a0a0a] border border-border-subtle rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center mb-3">
            <Link2 className="w-5 h-5 text-accent-blue" />
          </div>
          <h4 className="text-sm font-medium text-white mb-1">Connect {providerKey === 'sheets' ? 'Google Sheets' : 'Slack'}</h4>
          <p className="text-[10px] text-text-secondary mb-3">You will be redirected to securely log in.</p>
          
          <div className="flex gap-3 pt-4 w-full">
            <button 
              type="button"
              onClick={() => setIsConnecting(false)}
              className="flex-1 px-3 py-2 rounded-md text-[11px] font-medium text-text-secondary hover:text-white hover:bg-white/5 border border-border-subtle transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConnectOAuth}
              className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium px-3 py-2 rounded-md text-[11px] transition-colors flex items-center justify-center gap-2"
            >
              Sign in with {providerKey === 'sheets' ? 'Google' : providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
            </button>
          </div>

          <ConnectionGuideModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            providerName={providerKey === 'sheets' ? 'Google Sheets' : providerKey}
          />
        </div>
      );
    }

    if (providerKey === 'instagram' || providerKey === 'facebook' || providerKey === 'whatsapp') {
      return (
        <div className="bg-[#0a0a0a] border border-border-subtle rounded-lg p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-white capitalize">Connect {providerKey}</h4>
            </div>
            <p className="text-[10px] text-text-secondary">Choose how you want to securely connect your Meta account.</p>
          </div>

          {error && (
            <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3 mb-2">
             <button 
               type="button" 
               className={`p-3 text-left border rounded-lg transition-colors ${metaSetupMode === 'self-serve' ? 'border-accent-blue bg-accent-blue/10' : 'border-border-subtle hover:border-white/20'}`}
               onClick={() => setMetaSetupMode('self-serve')}
             >
               <h5 className="text-xs font-semibold text-white mb-1">Self-Serve</h5>
               <p className="text-[9px] text-text-tertiary">Provide your App ID & Secret.</p>
             </button>
             <button 
               type="button" 
               className={`p-3 text-left border rounded-lg transition-colors ${metaSetupMode === 'concierge' ? 'border-accent-blue bg-accent-blue/10' : 'border-border-subtle hover:border-white/20'}`}
               onClick={() => setMetaSetupMode('concierge')}
             >
               <h5 className="text-xs font-semibold text-white mb-1">Concierge Setup</h5>
               <p className="text-[9px] text-text-tertiary">We handle the technical setup.</p>
             </button>
          </div>

          {metaSetupMode === 'self-serve' && (
             <form onSubmit={handleMetaSelfServeSetup} className="space-y-3">
               <div>
                 <label className="block text-[10px] font-medium text-text-secondary mb-1">Connection Name</label>
                 <input 
                   type="text" 
                   value={connectionName}
                   onChange={(e) => setConnectionName(e.target.value)}
                   placeholder="e.g. My Meta App"
                   className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
                   required
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-medium text-text-secondary mb-1">Meta App ID</label>
                 <input 
                   type="text" 
                   value={appId}
                   onChange={(e) => setAppId(e.target.value)}
                   placeholder="Paste App ID here..."
                   className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
                   required
                 />
               </div>
                <div>
                 <label className="block text-[10px] font-medium text-text-secondary mb-1">Meta App Secret</label>
                 <input 
                   type="password" 
                   value={appSecret}
                   onChange={(e) => setAppSecret(e.target.value)}
                   placeholder="Paste App Secret here..."
                   className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
                   required
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-medium text-text-secondary mb-1">Page Access Token</label>
                 <input 
                   type="password" 
                   value={pageAccessToken}
                   onChange={(e) => setPageAccessToken(e.target.value)}
                   placeholder="Paste Page Access Token here..."
                   className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
                   required
                 />
                 <p className="text-[9px] text-text-tertiary mt-1">Required to automate webhook subscriptions. Stored securely.</p>
               </div>
               <div className="flex gap-2 pt-2">
                 <button 
                   type="button"
                   onClick={() => setIsConnecting(false)}
                   className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={isSaving || !appId.trim() || !appSecret.trim() || !pageAccessToken.trim() || !connectionName.trim()}
                   className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium px-3 py-1.5 rounded-md text-[11px] transition-colors flex items-center justify-center"
                 >
                   {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Connect & Automate Setup'}
                 </button>
               </div>
             </form>
          )}

          {metaSetupMode === 'concierge' && (
             <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center space-y-4">
                <p className="text-xs text-text-secondary">By submitting a Concierge Request, our infrastructure team will reach out to you via your registered email to get partner access to your Meta Business Manager. We will handle all the webhooks, tokens, and app creation securely on your behalf.</p>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsConnecting(false)}
                    className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConciergeRequest}
                    disabled={isSaving}
                    className="flex-1 bg-accent-violet hover:bg-accent-violet/90 text-white font-medium px-3 py-1.5 rounded-md text-[11px] transition-colors flex items-center justify-center"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Request Concierge'}
                  </button>
                </div>
             </div>
          )}

          <ConnectionGuideModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            providerName={provider === 'facebook' ? 'Instagram' : provider === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
          />
        </div>
      );
    }

    return (
      <div className="bg-[#0a0a0a] border border-border-subtle rounded-lg p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-white">Connect {providerKey === 'calendly' ? 'Calendly' : provider}</h4>
          </div>
          <p className="text-[10px] text-text-secondary">Generate a Personal Access Token in your account settings and paste it below.</p>
        </div>
        
        {error && (
          <div className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveConnection} className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-text-secondary mb-1">Connection Name</label>
            <input 
              type="text" 
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              placeholder="e.g. My Connection"
              className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-text-secondary mb-1">Account Email</label>
            <input 
              type="email" 
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
              required
            />
            {provider.toLowerCase() === 'smtp' && (
              <p className="text-[9px] text-text-tertiary mt-1">Note: This must match the exact email address for which you generated the App Password.</p>
            )}
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-text-secondary mb-1">Personal Access Token</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste token here..."
              className="w-full bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button"
              onClick={() => setIsConnecting(false)}
              className="flex-1 px-3 py-1.5 rounded-md text-[11px] font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving || !apiKey.trim() || !connectionName.trim() || !accountEmail.trim()}
              className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium px-3 py-1.5 rounded-md text-[11px] transition-colors flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify & Save'}
            </button>
          </div>
        </form>

        <ConnectionGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          providerName={provider === 'sheets' ? 'Google Sheets' : provider}
        />
      </div>
    );
  }

  if (connections.length > 0) {
    const activeConnection = connections.find(c => c.id === selectedConnectionId);
    const isConnected = !!activeConnection;

    return (
      <div className="space-y-3">
        <div className={`border rounded-md p-3 transition-colors ${isConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-400'}`}>
              {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
              <span className="text-xs font-medium">{isConnected ? 'Connected' : 'Connection Required'}</span>
            </div>
            {isConnected && onConnectionSelect && (
              <button 
                onClick={() => onConnectionSelect(null)}
                className="flex items-center gap-1 text-[10px] text-text-secondary hover:text-white hover:bg-white/5 px-2 py-1 rounded-sm transition-colors"
                title="Unselect from this step"
              >
                <Unlink2 className="w-3 h-3" /> Unselect
              </button>
            )}
          </div>
          
          <Select 
            value={activeConnection?.id || ''}
            onChange={(val) => {
              if (onConnectionSelect) {
                const conn = connections.find(c => c.id === val);
                onConnectionSelect(val, conn);
              }
            }}
            options={[
              { value: '', label: 'Select an account...' },
              ...connections.map(c => ({
                value: c.id,
                label: `${c.name} (${c.accountEmail})`
              }))
            ]}
            className={isConnected ? "text-green-400" : "text-white"}
          />
        </div>

        <button 
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-1.5 bg-transparent hover:bg-white/5 border border-dashed border-border-subtle hover:border-accent-blue/50 text-text-secondary hover:text-foreground px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
        >
          <Plus className="w-3 h-3" />
          Add Another Account
        </button>



        <ConnectionGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          providerName={provider === 'sheets' ? 'Google Sheets' : provider}
        />

        {provider.toLowerCase() === 'smtp' && (
          <SmtpModal 
            isOpen={isSmtpModalOpen} 
            onClose={() => setIsSmtpModalOpen(false)} 
            onSuccess={async (newId) => {
              setIsSmtpModalOpen(false);
              setLoading(true);
              const statuses = await getConnectionsByProvider(provider);
              setConnections(statuses);
              setLoading(false);
              
              if (newId && onConnectionSelect) {
                const found = statuses.find(c => c.id === newId);
                onConnectionSelect(newId, found);
              }
            }} 
          />
        )}

        <LegalConsentModal 
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          onAccept={handleConsentAccepted}
          provider={provider === 'sheets' ? 'Google Sheets' : provider === 'calendly' ? 'Calendly' : provider === 'instagram' ? 'Instagram' : provider}
        />
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={handleConnect}
        className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] hover:bg-white/5 border border-border-subtle hover:border-accent-blue/50 text-foreground px-4 py-2 rounded-md text-xs font-medium transition-all"
      >
        <Link2 className="w-4 h-4" />
        Connect {provider === 'calendly' ? 'Calendly' : provider} Account
      </button>

      {provider.toLowerCase() === 'smtp' && (
        <SmtpModal 
          isOpen={isSmtpModalOpen} 
          onClose={() => setIsSmtpModalOpen(false)} 
          onSuccess={async (newId) => {
            setIsSmtpModalOpen(false);
            setLoading(true);
            const statuses = await getConnectionsByProvider(provider);
            setConnections(statuses);
            setLoading(false);
            
            if (newId && onConnectionSelect) {
              const found = statuses.find(c => c.id === newId);
              onConnectionSelect(newId, found);
            }
          }} 
        />
      )}

      <LegalConsentModal 
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onAccept={handleConsentAccepted}
        provider={provider === 'sheets' ? 'Google Sheets' : provider === 'calendly' ? 'Calendly' : provider === 'instagram' ? 'Instagram' : provider}
      />
    </>
  );
}
