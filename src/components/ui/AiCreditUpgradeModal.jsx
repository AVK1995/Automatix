'use client';

import React from 'react';
import { Wand2, Sparkles, ExternalLink, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AiCreditUpgradeModal({ isOpen, onClose, creditsRemaining = 0 }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    window.open('/pricing', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <Wand2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Credits Quota Reached</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI Radahn Engine
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
          <div className="p-3.5 bg-black/50 border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary text-xs">Available AI Credits:</span>
              <span className="font-mono font-bold text-red-400 text-xs">{creditsRemaining} Credits</span>
            </div>
          </div>

          <p className="text-white font-medium">
            You need at least 1 AI Task Credit to run AI Radahn operations (Brand Optimizer, Email Drafter, Workflow Actions).
          </p>

          <p className="text-text-tertiary text-xs">
            Upgrade to a Professional or Enterprise plan to unlock up to 2,000 monthly AI credits, or add an instant top-up credit pack.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Zap size={14} />
            Upgrade Plan & Add Credits
            <ExternalLink size={13} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
