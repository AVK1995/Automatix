'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Globe, KeyRound, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WebhookGuideModal({ isOpen, onClose, integrationId }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('1. Add Webhook URL');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || integrationId !== 'instagram') return null;

  const tabs = {
    '1. Add Webhook URL': {
      steps: [
        <>Go to your <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta App Dashboard</a> and click <strong>Use cases</strong> in the left sidebar.</>,
        <>Click <strong>Customize</strong> next to <strong>Manage messaging & content on Instagram</strong>.</>,
        <>In the left sidebar menu of the Customize screen, click on <strong>API setup with Instagram login</strong>.</>,
        <>Scroll down to section <strong>3. Configure webhooks</strong> and expand it.</>,
        <>Paste your Automatix Webhook URL into the <strong>Callback URL</strong> field.</>,
        <>Paste <code>automatix_secure_meta_token_123</code> into the <strong>Verify token</strong> field.</>,
        <>Click the blue <strong>Verify and save</strong> button.</>
      ]
    },
    '2. Subscribe to Messages': {
      steps: [
        <>Directly below the "Verify and save" button, you will see a <strong>Webhook fields</strong> section.</>,
        <><strong className="text-white">Find the row labeled <code>messages</code> and click the Subscribe toggle so it turns blue.</strong></>,
        <>Find the row labeled <code>messaging_postbacks</code> and toggle its Subscribe switch to ON (blue).</>,
        <><strong>(Optional)</strong> If you also want to trigger workflows on post comments, subscribe to the <code>comments</code> field.</>
      ]
    }
  };

  const activeGuide = tabs[activeTab];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border-subtle rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-accent-blue">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">Instagram Webhook Setup</h2>
                    <p className="text-xs text-text-secondary mt-0.5">Follow these exact steps in your Meta Dashboard.</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-border-subtle scrollbar-hide bg-black/20 shrink-0">
                {Object.keys(tabs).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab 
                        ? 'border-accent-blue text-accent-blue bg-accent-blue/5' 
                        : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 bg-background">
                {activeGuide && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <KeyRound size={16} className="text-accent-violet" />
                        Step-by-Step Instructions
                      </h4>
                      <div className="space-y-4">
                        {activeGuide.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0 text-xs font-medium mt-0.5">
                              {index + 1}
                            </div>
                            <div className="text-sm text-text-secondary leading-relaxed pt-1">
                              {step}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeTab === '2. Subscribe to Messages' && (
                      <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                          <ShieldAlert size={16} />
                          CRITICAL: Missing Subscriptions
                        </h4>
                        <p className="text-xs text-red-400/80 leading-relaxed">
                          If you do not explicitly subscribe to the <code>messages</code> field, Meta will NEVER send incoming DMs to Automatix! Even if your App Token has permissions, the Webhook itself must be subscribed to receive events.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border-subtle bg-white/5 flex justify-end shrink-0">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
