'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Sparkles, 
  X, 
  Check, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Eye, 
  Code,
  FileText,
  Mail,
  Send,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import AiCreditUpgradeModal from '@/components/ui/AiCreditUpgradeModal';
import { 
  executeBrandOptimizer, 
  executeSmtpEmailDrafter, 
  executeSocialDrafter, 
  executeVisionPromptDrafter 
} from '@/lib/ai-radahn/brain';

export default function AiRadahnPromptModal({
  isOpen,
  onClose,
  type = 'smtp_email', // 'smtp_email' | 'vision_prompt' | 'social_message'
  initialContext = {},
  onApply
}) {
  const [userPrompt, setUserPrompt] = useState('');
  const [tone, setTone] = useState(initialContext.tone || 'professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [userCredits, setUserCredits] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCredits();
      runBrainGeneration();
    }
  }, [isOpen]);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/user/ai-credits');
      const data = await res.json();
      if (res.ok && typeof data.aiCredits === 'number') {
        setUserCredits(data.aiCredits);
      }
    } catch (e) {
      console.warn('Could not fetch AI credits:', e);
    }
  };

  const runBrainGeneration = () => {
    setIsGenerating(true);
    try {
      if (type === 'smtp_email') {
        const res = executeSmtpEmailDrafter({
          triggerData: initialContext.triggerData || {},
          previousSteps: initialContext.previousSteps || [],
          userPrompt: userPrompt || initialContext.userPrompt || '',
          brandTone: tone
        });
        setGeneratedOutput(res);
      } else if (type === 'vision_prompt') {
        const res = executeVisionPromptDrafter({
          brandTone: tone,
          mediaType: initialContext.mediaType || 'media',
          taskOperation: initialContext.task || 'generate_caption'
        });
        setGeneratedOutput(res);
      } else if (type === 'social_message') {
        const res = executeSocialDrafter({
          platform: initialContext.platform || 'INSTAGRAM_DM',
          context: initialContext.context || {},
          userPrompt: userPrompt || ''
        });
        setGeneratedOutput(res);
      }
    } catch (err) {
      toast.error('AI Radahn generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!generatedOutput) return;
    setIsApplying(true);

    try {
      // Deduct 1 credit via API
      const res = await fetch('/api/user/ai-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost: 1,
          operation: `AI_RADAHN_${type.toUpperCase()}`
        })
      });

      const data = await res.json();

      if (res.status === 402 || data.error === 'INSUFFICIENT_CREDITS') {
        setIsUpgradeModalOpen(true);
        setIsApplying(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process AI credits');
      }

      // Apply output
      onApply(generatedOutput);
      toast.success(`AI Radahn Content Applied! (${data.creditsRemaining} credits remaining)`);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to apply generation');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-in fade-in duration-200">
        <div 
          className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-black shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {type === 'smtp_email' ? 'AI Radahn Email Drafter' : type === 'vision_prompt' ? 'AI Radahn Vision Prompt Drafter' : 'AI Radahn Message Drafter'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    1 AI Task Credit
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Context-aware generation utilizing workflow variables and trigger payloads.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {userCredits !== null && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary">
                  <Zap size={13} className="text-purple-400" />
                  <span>{userCredits} Credits</span>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs sm:text-sm">
            
            {/* Input & Prompt modification */}
            <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">Custom Goal / Prompt Focus (Optional)</label>
                <button
                  type="button"
                  onClick={runBrainGeneration}
                  disabled={isGenerating}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                  Re-draft
                </button>
              </div>
              <input
                type="text"
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder="e.g. Include a 15% discount coupon or focus on urgent order confirmation..."
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue"
              />
            </div>

            {/* Generated Output Review Pane */}
            {generatedOutput && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Generated Output Preview
                  </span>
                  <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-2.5 py-1 rounded transition-all ${
                        activeTab === 'preview' ? 'bg-white/15 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className={`px-2.5 py-1 rounded transition-all ${
                        activeTab === 'code' ? 'bg-white/15 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      Raw Code
                    </button>
                  </div>
                </div>

                {type === 'smtp_email' && (
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50">
                    <div className="p-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                      <span className="text-text-tertiary text-xs font-medium">Subject:</span>
                      <span className="text-white text-xs font-bold">{generatedOutput.subject}</span>
                    </div>
                    {activeTab === 'preview' ? (
                      <div 
                        className="p-4 prose prose-sm prose-invert max-w-none text-xs leading-relaxed max-h-60 overflow-y-auto custom-scrollbar"
                        dangerouslySetInnerHTML={{ __html: generatedOutput.htmlBody }}
                      />
                    ) : (
                      <pre className="p-4 text-[11px] font-mono text-purple-300 max-h-60 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                        {generatedOutput.htmlBody}
                      </pre>
                    )}
                  </div>
                )}

                {type === 'vision_prompt' && (
                  <div className="p-4 border border-white/10 rounded-xl bg-black/50 space-y-2">
                    <div className="text-xs font-semibold text-purple-300">Optimized Custom Instruction:</div>
                    <p className="text-xs text-white leading-relaxed font-mono bg-black/70 p-3 rounded-lg border border-white/5">
                      {generatedOutput.generatedInstruction}
                    </p>
                  </div>
                )}

                {type === 'social_message' && (
                  <div className="p-4 border border-white/10 rounded-xl bg-black/50 space-y-2">
                    <div className="text-xs font-semibold text-accent-blue">Drafted Social Message:</div>
                    <p className="text-xs text-white leading-relaxed bg-black/70 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {generatedOutput.message}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer with Safeguard Approval */}
          <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-text-tertiary flex items-center gap-1.5">
              <Zap size={13} className="text-purple-400" /> Charges 1 AI Task Credit upon application
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || !generatedOutput}
                className="w-full sm:w-auto px-5 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isApplying ? (
                  <><RefreshCw size={13} className="animate-spin" /> Applying...</>
                ) : (
                  <><Check size={14} /> Accept & Insert Template</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Upgrade Modal if Credits are Exhausted */}
      <AiCreditUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        creditsRemaining={userCredits || 0}
      />
    </>
  );
}
