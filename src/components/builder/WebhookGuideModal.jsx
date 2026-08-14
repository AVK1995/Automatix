'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WebhookGuideModal({ isOpen, onClose, integrationId }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  let guide = null;

  if (integrationId === 'instagram') {
    guide = {
      title: 'Instagram Webhook Setup',
      icon: Camera,
      tabs: [
        {
          name: '1. Add Webhook URL',
          steps: [
            <>Go to your <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline font-medium">Meta App Dashboard</a> and click <strong>Use cases</strong> in the left sidebar.</>,
            <>Click <strong>Customize</strong> next to <strong>Manage messaging & content on Instagram</strong>.</>,
            <>In the left sidebar menu of the Customize screen, click on <strong>API setup with Instagram login</strong>.</>,
            <>Scroll down to section <strong>3. Configure webhooks</strong> and expand it.</>,
            <>Paste your Automatix Webhook URL into the <strong>Callback URL</strong> field.</>,
            <>If you have set a <code>META_APP_SECRET</code> in your Vercel environment variables, paste it into the <strong>Verify token</strong> field. (If you haven't, you can paste any random string like <code>automatix</code> just to pass verification).</>,
            <>Click the blue <strong>Verify and save</strong> button.</>
          ]
        },
        {
          name: '2. Subscribe to Messages',
          steps: [
            <>Directly below the "Verify and save" button, you will see a <strong>Webhook fields</strong> section.</>,
            <><strong className="text-red-400">CRITICAL STEP:</strong> Find the row labeled <strong>messages</strong> and toggle the <strong>Subscribe</strong> switch to ON (blue).</>,
            <>Find the row labeled <strong>messaging_postbacks</strong> and toggle its <strong>Subscribe</strong> switch to ON (blue).</>,
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-text-secondary">
              If you do not subscribe to the <code>messages</code> field, Meta will NEVER send incoming DMs to Automatix!
            </div>,
            <><strong>(Optional)</strong> If you also want to trigger workflows on post comments, subscribe to the <code>comments</code> field.</>
          ]
        }
      ]
    };
  }

  if (!guide) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
          className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <guide.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{guide.title}</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Follow these exact steps in your Meta Dashboard</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-tertiary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar Tabs */}
            <div className="w-48 border-r border-white/5 bg-black/10 p-3 space-y-1 overflow-y-auto custom-scrollbar">
              {guide.tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === idx 
                      ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20' 
                      : 'text-text-secondary hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-black/5">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">{guide.tabs[activeTab].name}</h3>
                  <div className="space-y-4">
                    {guide.tabs[activeTab].steps.map((step, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center mt-0.5">
                          <div className="w-6 h-6 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-semibold text-accent-blue shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors duration-300">
                            {idx + 1}
                          </div>
                          {idx !== guide.tabs[activeTab].steps.length - 1 && (
                            <div className="w-px h-full bg-white/5 mt-2 group-hover:bg-accent-blue/20 transition-colors" />
                          )}
                        </div>
                        <div className="pb-4 text-sm text-text-secondary leading-relaxed pt-0.5">
                          {step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
