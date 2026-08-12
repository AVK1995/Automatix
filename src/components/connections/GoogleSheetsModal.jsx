'use client';

import { useState, useEffect } from 'react';
import { addByokConnection, testSheetsConnection } from '@/actions/connections';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function GoogleSheetsModal({ isOpen, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    privateKey: '',
    testSheetId: ''
  });
  const [testSuccess, setTestSuccess] = useState(false);
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
    }
    setError(null);

    try {
      if (isTest) {
        if (!formData.testSheetId) {
          setTestError('Please enter a Spreadsheet ID to test the connection.');
          setLoading(false);
          return;
        }
        
        // Dynamic import to avoid missing dependencies
        const { testSheetsConnection } = await import('@/actions/connections');
        const testResult = await testSheetsConnection(formData.email, formData.privateKey, formData.testSheetId);
        
        if (testResult && !testResult.success) {
          setTestError(testResult.error || 'Connection test failed. Check your credentials and spreadsheet ID.');
        } else {
          setTestSuccess(true);
        }
        setLoading(false);
        return;
      }

      if (!testSuccess) {
        setError('You must successfully test the connection before saving.');
        setLoading(false);
        return;
      }

      const result = await addByokConnection({
        provider: 'google-sheets-pseudo',
        name: formData.name,
        email: formData.email,
        privateKey: formData.privateKey
      });
      
      if (result && !result.success) {
        setError(result.error || 'Failed to save connection.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error saving connection');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-border-subtle rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-medium text-foreground">Connect Google Sheets</h2>
            <p className="text-xs text-text-secondary mt-1">Authenticate using a Google Cloud Service Account.</p>
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

          <form id="sheets-form" onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Connection Name</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="My Google Sheets"
              />
              <p className="text-xs text-text-secondary mt-1">Name your connection to identify it later.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Service Account Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="service-account@project.iam.gserviceaccount.com"
              />
              <p className="text-xs text-text-secondary mt-1">The email address of your Google Cloud Service Account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Private Key</label>
              <textarea
                required
                rows={4}
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono text-xs"
                placeholder="-----BEGIN PRIVATE KEY-----\n..."
              />
              <p className="text-xs text-text-secondary mt-1">Paste the entire private key, including the BEGIN and END lines.</p>
            </div>

            <div className="pt-4 border-t border-border-subtle mt-2">
              <label className="block text-sm font-medium text-foreground mb-1">Test Connection</label>
              <input
                type="text"
                autoComplete="off"
                value={formData.testSheetId}
                onChange={(e) => { 
                  setFormData({ ...formData, testSheetId: e.target.value }); 
                  setTestSuccess(false); 
                  setTestError(null);
                }}
                className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                placeholder="Enter Spreadsheet ID"
              />
              <p className="text-xs text-text-secondary mt-1">Share this spreadsheet with your Service Account Email. We will append a test row to verify write access.</p>
              
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
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                  <div className="flex items-center gap-2 text-green-500 font-medium mb-1">
                    <span>✓ Connection Successful</span>
                  </div>
                  <p className="text-sm text-green-400 opacity-90">Test row successfully appended to cell A1 of Spreadsheet <strong>{formData.testSheetId}</strong>.</p>
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
              form="sheets-form"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-background border border-border-subtle rounded-md hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {loading && formData.testSheetId ? <Loader2 size={16} className="animate-spin" /> : null}
              Test Connection
            </button>
            <button
              type="submit"
              name="save"
              form="sheets-form"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && !formData.testSheetId ? <Loader2 size={16} className="animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
