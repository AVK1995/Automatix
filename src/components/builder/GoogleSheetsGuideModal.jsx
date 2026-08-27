'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function GoogleSheetsGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('setup');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto"
        >
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-white/5 bg-white/[0.02]">
            <div className="min-w-0 pr-2">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                Google Sheets Trigger Guide
              </h2>
              <p className="text-[11px] sm:text-xs text-text-tertiary mt-0.5 truncate">
                Configure Apps Script and bypass security warnings.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-white transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>

          {/* Video Guide Section */}
          <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 bg-black/30 border-b border-white/5">
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black shadow-inner">
              <video 
                src="/assets/Google Sheet App Script Guide.mp4" 
                controls 
                autoPlay 
                muted 
                loop 
                playsInline
                className="w-full max-h-40 sm:max-h-56 md:max-h-64 object-contain bg-black"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-black/20 shrink-0">
            <button 
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                activeTab === 'setup' ? 'text-accent-blue border-b-2 border-accent-blue font-semibold' : 'text-text-secondary hover:text-white'
              }`}
              onClick={() => setActiveTab('setup')}
            >
              <span className="hidden sm:inline">1. Setup Guide</span>
              <span className="sm:hidden">1. Setup</span>
            </button>
            <button 
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                activeTab === 'auth' ? 'text-accent-blue border-b-2 border-accent-blue font-semibold' : 'text-text-secondary hover:text-white'
              }`}
              onClick={() => setActiveTab('auth')}
            >
              <span className="hidden sm:inline">2. Bypass "Unverified App"</span>
              <span className="sm:hidden">2. Bypass Warning</span>
            </button>
            <button 
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium transition-colors text-center px-1 truncate ${
                activeTab === 'issues' ? 'text-accent-blue border-b-2 border-accent-blue font-semibold' : 'text-text-secondary hover:text-white'
              }`}
              onClick={() => setActiveTab('issues')}
            >
              <span className="hidden sm:inline">3. Missing Apps Script?</span>
              <span className="sm:hidden">3. Troubleshooting</span>
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            {activeTab === 'setup' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">1</div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-white">Open Apps Script</h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-1">In your Google Sheet, click on <strong>Extensions</strong> in the top menu bar, then select <strong>Apps Script</strong>.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">2</div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-white">Paste the Code</h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-1">Delete any existing code in the editor, and paste the code copied from the Automatix builder.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">3</div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-white">Save and Click Run</h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-1">Click the Save icon. Keep <code className="bg-white/10 px-1 rounded">setupTrigger</code> selected at the top and click <strong>Run</strong>.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs"><CheckCircle2 className="w-4 h-4" /></div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-white">Authorize Once & Done!</h3>
                      <p className="text-[11px] sm:text-xs text-text-secondary mt-1">
                        Google will ask you to authorize the script (click <strong>Review Permissions</strong>). Once granted, the script automatically registers the real-time background trigger AND instantly shoots your test row to Automatix!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3.5 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-amber-500 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> The "Google hasn't verified this app" Warning
                  </h3>
                  <p className="text-[11px] sm:text-xs text-amber-400/90 leading-relaxed">
                    Because you are running a custom script you just created, Google will flag it as "Unverified". This is completely normal and safe since <strong>you</strong> are the one who wrote/pasted the code.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-medium text-white">How to bypass it:</h4>
                  <ol className="list-decimal pl-5 text-[11px] sm:text-xs text-text-secondary space-y-2.5 marker:text-text-tertiary">
                    <li>When the "Authorization required" popup appears, click <strong>Review permissions</strong>.</li>
                    <li>Select your Google account.</li>
                    <li>You will see a warning screen saying "Google hasn't verified this app". Click on the <strong>Advanced</strong> link at the bottom left.</li>
                    <li>Click on <strong>Go to Untitled project (unsafe)</strong> (or whatever your script is named).</li>
                    <li>Finally, click <strong>Allow</strong> to grant the script permission to read your sheet and send the webhook to Automatix.</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-6">
                <h3 className="text-xs sm:text-sm font-medium text-white mb-2">I don't see "Apps Script" in the Extensions menu</h3>
                
                <div className="space-y-4 text-[11px] sm:text-xs text-text-secondary">
                  <p>
                    If you are using a work or school Google account (Google Workspace), your administrator might have disabled Google Apps Script for your organization.
                  </p>
                  
                  <div className="bg-white/5 border border-white/10 rounded-md p-3.5 sm:p-4">
                    <h4 className="font-medium text-white mb-2">Solutions:</h4>
                    <ul className="list-disc pl-4 space-y-2">
                      <li><strong>Contact Admin:</strong> Ask your Google Workspace administrator to enable Apps Script for your organization account.</li>
                      <li><strong>Use a Personal Account:</strong> Apps Script is always enabled and available on standard @gmail.com personal accounts.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3.5 sm:p-5 border-t border-white/5 bg-white/[0.02] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-medium transition-colors"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
