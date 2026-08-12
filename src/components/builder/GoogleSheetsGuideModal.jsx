import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function GoogleSheetsGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('setup');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 bg-white/[0.02]">
            <div>
              <h2 className="text-lg font-semibold text-white">Google Sheets Real-Time Trigger Guide</h2>
              <p className="text-xs text-text-tertiary mt-1">Learn how to configure Apps Script and bypass security warnings.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-white/5">
            <button 
              className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'setup' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('setup')}
            >
              1. Setup Guide
            </button>
            <button 
              className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'auth' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('auth')}
            >
              2. Bypassing "Unverified App"
            </button>
            <button 
              className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'issues' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-white'}`}
              onClick={() => setActiveTab('issues')}
            >
              3. Missing Apps Script?
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            {activeTab === 'setup' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">1</div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Open Apps Script</h3>
                      <p className="text-xs text-text-secondary mt-1">In your Google Sheet, click on <strong>Extensions</strong> in the top menu bar, then select <strong>Apps Script</strong>.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">2</div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Paste the Code</h3>
                      <p className="text-xs text-text-secondary mt-1">Delete any existing code in the editor, and paste the code copied from the Automatix builder.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center font-bold text-xs">3</div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Save and Run</h3>
                      <p className="text-xs text-text-secondary mt-1">Click the Save icon (💾). Then, from the dropdown menu at the top, select <code className="bg-white/10 px-1 rounded">setupTrigger</code> and click the <strong>Run</strong> button.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs"><CheckCircle2 className="w-4 h-4" /></div>
                    <div>
                      <h3 className="text-sm font-medium text-white">Authorize (Important!)</h3>
                      <p className="text-xs text-text-secondary mt-1">Google will ask you to authorize the script. Click <strong>Review Permissions</strong>. See the next tab if you get an "Unverified App" warning.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-6">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
                  <h3 className="text-sm font-medium text-amber-500 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> The "Google hasn't verified this app" Warning
                  </h3>
                  <p className="text-xs text-amber-400/90 leading-relaxed">
                    Because you are running a custom script you just created, Google will flag it as "Unverified". This is completely normal and safe since <strong>you</strong> are the one who wrote/pasted the code.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-white">How to bypass it:</h4>
                  <ol className="list-decimal pl-5 text-xs text-text-secondary space-y-3 marker:text-text-tertiary">
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
                <h3 className="text-sm font-medium text-white mb-2">I don't see "Apps Script" in the Extensions menu</h3>
                
                <div className="space-y-4 text-xs text-text-secondary">
                  <p>
                    If you are using a work or school Google account (Google Workspace), your administrator might have disabled Google Apps Script for your organization.
                  </p>
                  
                  <div className="bg-white/5 border border-white/10 rounded-md p-4">
                    <h4 className="font-medium text-white mb-2">Solutions:</h4>
                    <ul className="list-disc pl-4 space-y-2">
                      <li><strong>Use the "Polling" Method:</strong> Switch the Trigger Method in Automatix from "Real-Time (Apps Script)" to "1-Minute Polling (No Code)". This requires zero setup on your end and works automatically!</li>
                      <li><strong>Contact Admin:</strong> Ask your Google Workspace administrator to enable Apps Script for your account.</li>
                      <li><strong>Use a Personal Account:</strong> Apps Script is always available on personal @gmail.com accounts.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 sm:p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-medium transition-colors"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
