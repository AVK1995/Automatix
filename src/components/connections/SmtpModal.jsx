'use client';

import { useState, useEffect } from 'react';
import { saveConnection, testSmtpConnection } from '@/actions/connections';
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function SmtpModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
    encryption: '',
    port: '',
    testEmail: ''
  });
  const [testSuccess, setTestSuccess] = useState(false);
  const [testHtml, setTestHtml] = useState(null);
  const [error, setError] = useState(null);
  const [testError, setTestError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if test was clicked vs save
    const submitter = e.nativeEvent?.submitter;
    const isTest = submitter?.name === 'test';

    setLoading(true);
    if (isTest) {
      setTestSuccess(false);
      setTestError(null);
      setTestHtml(null);
    }
    setError(null);

    try {
      const credentialString = JSON.stringify({
        host: formData.host,
        username: formData.username,
        password: formData.password,
        encryption: formData.encryption,
        port: formData.port
      });

      if (isTest) {
        if (!formData.testEmail) {
          setTestError('Please enter a test email address.');
          setLoading(false);
          return;
        }
        
        // Dynamic import to avoid missing dependencies
        const { testSmtpConnection } = await import('@/actions/connections');
        const testResult = await testSmtpConnection(credentialString, formData.testEmail);
        
        if (testResult && !testResult.success) {
          setTestError(testResult.error || 'Connection test failed. Check your credentials.');
        } else {
          setTestSuccess(true);
          setTestHtml(testResult.htmlContent);
        }
        setLoading(false);
        return;
      }

      if (!testSuccess) {
        setError('You must successfully test the connection before saving.');
        setLoading(false);
        return;
      }

      const result = await saveConnection('SMTP', formData.name, credentialString, formData.username);
      
      if (result && !result.success) {
        setError(result.error || 'Failed to save connection.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
      onSuccess(result.id);
    } catch (err) {
      console.error(err);
      setError('Error saving connection');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-border-subtle rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-medium text-foreground">Connect SMTP Account</h2>
            <p className="text-xs text-text-secondary mt-1">All connections are fully encrypted and secure.</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <form id="smtp-form" onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Connection Name</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="My SMTP Server"
              />
              <p className="text-xs text-text-secondary mt-1">Name your connection to identify it later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Host Name</label>
              <input
                type="text"
                required
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Host Name here"
              />
              <p className="text-xs text-text-secondary mt-1">Enter your SMTP Hostname. E.g. smtp.gmail.com</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username / Email Address</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Username or Email here"
              />
              <p className="text-xs text-text-secondary mt-1">Enter your SMTP Username (usually your email address).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Password here"
              />
              <p className="text-xs text-text-secondary mt-1">Enter your SMTP Password.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Encryption Type</label>
              <input
                type="text"
                value={formData.encryption}
                onChange={(e) => setFormData({ ...formData, encryption: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Encryption Type here"
              />
              <p className="text-xs text-text-secondary mt-1">Enter your SMTP Encryption Type ( TLS / SSL / NONE ). E.g. TLS</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Port</label>
              <input
                type="text"
                required
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Port here"
              />
              <p className="text-xs text-text-secondary mt-1">Enter your SMTP Port ( 587 / 465 / 2525 / 25 ). E.g. 587</p>
            </div>
            <div className="pt-4 border-t border-border-subtle mt-2">
              <label className="block text-sm font-medium text-foreground mb-1">Test Connection</label>
              <input
                type="email"
                autoComplete="off"
                value={formData.testEmail}
                onChange={(e) => { 
                  setFormData({ ...formData, testEmail: e.target.value }); 
                  setTestSuccess(false); 
                  setTestError(null);
                  setTestHtml(null);
                }}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter email to receive test message"
              />
              <p className="text-xs text-text-secondary mt-1">We will send a beautiful HTML test email to verify credentials.</p>
              
              {testError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <div className="flex items-center gap-2 text-red-500 font-medium mb-1">
                    <AlertTriangle size={16} />
                    <span>Connection Test Failed</span>
                  </div>
                  <p className="text-sm text-red-400 font-mono break-words">{testError}</p>
                </div>
              )}

              {testSuccess && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                    <div className="flex items-center gap-2 text-green-500 font-medium mb-1">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Connection Successful</span>
                    </div>
                    <p className="text-sm text-green-400 opacity-90">Test email was successfully sent to {formData.testEmail}.</p>
                  </div>
                  
                  {testHtml && (
                    <div className="border border-border-subtle rounded-md overflow-hidden bg-white">
                      <div className="bg-background border-b border-border-subtle px-3 py-2 text-xs text-text-secondary font-medium">
                        Email Preview
                      </div>
                      <iframe 
                        srcDoc={testHtml}
                        className="w-full h-[400px]"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border-subtle bg-card rounded-b-xl">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground bg-background border border-border-subtle rounded-md hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="submit"
              name="test"
              form="smtp-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-background border border-border-subtle rounded-md hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {loading && formData.testEmail ? <Loader2 size={16} className="animate-spin" /> : null}
              Test Connection
            </button>
            <button
              type="submit"
              name="save"
              form="smtp-form"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && !formData.testEmail ? <Loader2 size={16} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
