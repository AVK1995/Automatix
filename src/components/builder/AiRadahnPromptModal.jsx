'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  RotateCcw,
  Eraser,
  SendHorizontal,
  Play
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
  type = 'smtp_email', // 'smtp_email' | 'vision_prompt' | 'ai_prompt' | 'social_message' | 'code_js' | 'http_payload'
  context = {},
  initialContext = {},
  availableVariables = [],
  onApply
}) {
  const mergedContext = { ...initialContext, ...context };
  const incomingPrompt = mergedContext.initialPrompt || mergedContext.customPrompt || mergedContext.userPrompt || mergedContext.prompt || mergedContext.message || mergedContext.body || '';

  const [userPrompt, setUserPrompt] = useState(incomingPrompt);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [tone, setTone] = useState(mergedContext.tone || 'storytelling');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [userCredits, setUserCredits] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchCredits();
      const promptToUse = incomingPrompt;
      setUserPrompt(promptToUse);
      runBrainGeneration(promptToUse);
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

  const runBrainGeneration = (customPromptOverride) => {
    const promptToUse = typeof customPromptOverride === 'string' ? customPromptOverride : (userPrompt || incomingPrompt);
    setIsGenerating(true);
    try {
      if (type === 'smtp_email') {
        const res = executeSmtpEmailDrafter({
          triggerData: mergedContext.triggerData || {},
          previousSteps: mergedContext.previousSteps || [],
          userPrompt: promptToUse,
          brandTone: tone
        });
        setGeneratedOutput(res);
      } else if (type === 'vision_prompt' || type === 'ai_prompt') {
        const res = executeVisionPromptDrafter({
          brandTone: tone,
          mediaType: mergedContext.mediaType || 'media',
          taskOperation: mergedContext.task || 'generate_caption',
          userPrompt: promptToUse
        });
        setGeneratedOutput(res);
      } else if (type === 'social_message' || type === 'slack_message') {
        const res = executeSocialDrafter({
          platform: mergedContext.platform || 'INSTAGRAM_DM',
          context: mergedContext.context || {},
          userPrompt: promptToUse
        });
        setGeneratedOutput(res);
      } else {
        // Fallback generic synthesizer
        const res = executeBrandOptimizer({
          rawText: promptToUse || 'Synthesize high impact workflow copy and instructions.',
          tone
        });
        setGeneratedOutput({ body: res.optimizedCopy || res, customPrompt: res.optimizedCopy || res });
      }
      toast.success('AI Radahn synthesized output successfully!');
    } catch (err) {
      console.error(err);
      toast.error('AI Radahn generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = () => {
    if (!refinePrompt.trim()) {
      return toast.error('Please enter refinement instructions.');
    }

    setIsRefining(true);
    try {
      const combinedPrompt = `${userPrompt ? userPrompt + '. ' : ''}Refinement: ${refinePrompt}`;
      
      if (type === 'smtp_email') {
        const res = executeSmtpEmailDrafter({
          triggerData: mergedContext.triggerData || {},
          previousSteps: mergedContext.previousSteps || [],
          userPrompt: combinedPrompt,
          brandTone: tone
        });
        setGeneratedOutput(res);
      } else if (type === 'social_message' || type === 'slack_message') {
        const res = executeSocialDrafter({
          platform: mergedContext.platform || 'INSTAGRAM_DM',
          context: mergedContext.context || {},
          userPrompt: combinedPrompt
        });
        setGeneratedOutput(res);
      } else {
        const res = executeVisionPromptDrafter({
          brandTone: tone,
          mediaType: mergedContext.mediaType || 'media',
          taskOperation: mergedContext.task || 'generate_caption',
          userPrompt: combinedPrompt
        });
        setGeneratedOutput(res);
      }

      setUserPrompt(combinedPrompt);
      setRefinePrompt('');
      toast.success('Applied refinement changes!');
    } catch (e) {
      toast.error('Refinement failed');
    } finally {
      setIsRefining(false);
    }
  };

  const handleClear = () => {
    setGeneratedOutput(null);
    setUserPrompt('');
    setRefinePrompt('');
    toast.success('Cleared draft. You can generate completely anew.');
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
          className="bg-[#111116] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Header - Single Line Clean Layout */}
          <div className="p-4 sm:p-5 border-b border-white/10 relative flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-black shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-purple-200" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug truncate">
                    {type === 'smtp_email' ? 'AI Radahn Email Drafter' : type === 'vision_prompt' || type === 'ai_prompt' ? 'AI Radahn Prompt Architect' : 'AI Radahn Message Drafter'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    AI RADAHN BRAIN
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 truncate hidden sm:block">
                  Context-aware generation utilizing workflow variables and custom tone styling.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {userCredits !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-mono font-semibold text-purple-300 whitespace-nowrap shrink-0">
                  <Zap size={12} className="text-purple-400 shrink-0" />
                  <span>{userCredits} Credits</span>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
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
                <div className="flex items-center gap-2">
                  {generatedOutput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-rose-400 rounded text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => runBrainGeneration()}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                    {generatedOutput ? 'Re-draft' : 'Draft with AI Radahn'}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder="e.g. Tactical camo green CTA, remove eyebrow, include discount..."
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            {/* Generated Output Review Pane */}
            {generatedOutput && (
              <div className="space-y-3">
                
                {/* Iterative Refinement Bar */}
                <div className="bg-purple-950/20 border border-purple-500/25 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                      <Wand2 size={12} /> Refine & Modify Draft
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      Type tweaks to modify existing output
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={refinePrompt}
                      onChange={e => setRefinePrompt(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRefine();
                        }
                      }}
                      placeholder="e.g. Make it more concise, emphasize 20% launch discount..."
                      className="flex-1 bg-black/60 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={handleRefine}
                      disabled={isRefining || !refinePrompt.trim()}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {isRefining ? <RefreshCw size={12} className="animate-spin" /> : <SendHorizontal size={12} />}
                      <span>Apply Tweak</span>
                    </button>
                  </div>
                </div>

                {/* Subject Preview for Email */}
                {generatedOutput.subject && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Subject Line</span>
                    <p className="text-xs font-semibold text-white">{generatedOutput.subject}</p>
                  </div>
                )}

                {/* Generated Content Body */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[11px] font-mono font-semibold text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={11} /> Synthesized AI Radahn Content
                    </span>
                  </div>

                  <div className="p-3.5 max-h-60 overflow-y-auto custom-scrollbar font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed">
                    {generatedOutput.customPrompt || generatedOutput.prompt || generatedOutput.body || generatedOutput.message || (typeof generatedOutput === 'string' ? generatedOutput : JSON.stringify(generatedOutput, null, 2))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0d0d12] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
              <Zap size={13} className="text-purple-400 shrink-0" />
              <span>Charges <strong>1 AI Task Credit</strong> upon application</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-secondary hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || !generatedOutput}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Check size={13} />}
                <span>Accept & Insert Template</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <AiCreditUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
