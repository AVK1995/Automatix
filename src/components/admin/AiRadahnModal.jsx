'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  GitBranch,
  CheckCircle2,
  Loader2,
  Wand2,
  X,
  RefreshCw,
  Eye,
  Code,
  ArrowRight,
  Shield,
  Zap,
  Layers,
  FileText,
  Check,
  Rocket
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';

const TONE_OPTIONS = [
  {
    value: 'feature_release',
    label: 'Feature Launch & Excitement',
    icon: <Rocket size={14} className="text-purple-400 shrink-0" />
  },
  {
    value: 'performance_update',
    label: 'Speed & Performance Engine',
    icon: <Zap size={14} className="text-amber-400 shrink-0" />
  },
  {
    value: 'security_compliance',
    label: 'Security & Reliability Notice',
    icon: <Shield size={14} className="text-emerald-400 shrink-0" />
  },
  {
    value: 'executive_summary',
    label: 'Executive Product Changelog',
    icon: <FileText size={14} className="text-blue-400 shrink-0" />
  }
];

export default function AiRadahnModal({
  isOpen,
  onClose,
  initialMode = 'ANNOUNCEMENTS', // 'ANNOUNCEMENTS' | 'REFINE'
  currentSubject = '',
  currentBody = '',
  onApply
}) {
  const [mode, setMode] = useState(initialMode); // 'ANNOUNCEMENTS' | 'REFINE'
  
  // Deployments state
  const [deployments, setDeployments] = useState([]);
  const [selectedDeployments, setSelectedDeployments] = useState([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [tone, setTone] = useState('feature_release');

  // Refine state
  const [refineInstruction, setRefineInstruction] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState(null); // { subject, body }
  const [previewTab, setPreviewTab] = useState('rendered'); // 'rendered' | 'code'

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setGeneratedOutput(null);
      setRefineInstruction('');
      if (initialMode === 'ANNOUNCEMENTS' || deployments.length === 0) {
        fetchDeployments();
      }
    }
  }, [isOpen, initialMode]);

  const fetchDeployments = async () => {
    setLoadingDeployments(true);
    try {
      const res = await fetch('/api/admin/ai-radahn/deployments');
      const data = await res.json();
      if (res.ok && data.deployments) {
        setDeployments(data.deployments);
        // Pre-select top 3 feature commits
        const topFeatures = data.deployments.slice(0, 3).map(d => d.message);
        setSelectedDeployments(topFeatures);
      }
    } catch (e) {
      console.error('Failed to fetch deployments:', e);
    } finally {
      setLoadingDeployments(false);
    }
  };

  const toggleDeployment = (message) => {
    setSelectedDeployments(prev =>
      prev.includes(message) ? prev.filter(m => m !== message) : [...prev, message]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeployments.length === deployments.length) {
      setSelectedDeployments([]);
    } else {
      setSelectedDeployments(deployments.map(d => d.message));
    }
  };

  const handleGenerateAnnouncement = async () => {
    if (selectedDeployments.length === 0 && !customNotes.trim()) {
      return toast.error('Please select at least one deployment or add custom notes.');
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/ai-radahn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ANNOUNCEMENT_FROM_DEPLOYMENTS',
          selectedDeployments,
          customNotes,
          tone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate announcement');

      setGeneratedOutput({
        subject: data.subject,
        body: data.body
      });
      toast.success('AI Radahn successfully composed the feature announcement!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRefinement = async () => {
    if (!refineInstruction.trim()) {
      return toast.error('Please describe what modifications you want AI Radahn to perform.');
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/ai-radahn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'REFINE',
          subject: currentSubject,
          body: currentBody,
          instruction: refineInstruction
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refine email');

      setGeneratedOutput({
        subject: data.subject,
        body: data.body
      });
      toast.success('AI Radahn successfully refined the subject and email body!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (!generatedOutput) return;
    onApply(generatedOutput);
    toast.success('Applied AI Radahn changes to broadcast composer!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Responsive Mobile Optimized */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black relative flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 pr-8 sm:pr-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0 mt-0.5 sm:mt-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-snug">
                  AI Radahn Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 whitespace-nowrap">
                  AI Radahn Brain
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2 sm:line-clamp-none">
                Generate executive feature announcements from repo deployments or refine existing email drafts with approval safeguards.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:static text-text-tertiary hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-white/10 bg-black/40 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setMode('ANNOUNCEMENTS'); setGeneratedOutput(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              mode === 'ANNOUNCEMENTS'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <GitBranch size={15} className="text-purple-400" />
            Feature Announcement from Deployments
          </button>

          <button
            type="button"
            onClick={() => { setMode('REFINE'); setGeneratedOutput(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
              mode === 'REFINE'
                ? 'border-accent-blue text-white'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <Wand2 size={15} className="text-accent-blue" />
            Refine & Modify Current Draft
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-xs sm:text-sm">
          
          {/* ================= MODE 1: ANNOUNCEMENTS FROM DEPLOYMENTS ================= */}
          {mode === 'ANNOUNCEMENTS' && (
            <div className="space-y-5">
              
              {/* Deployments List Card */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-purple-400 shrink-0" />
                    <span className="font-semibold text-white">Select Recent Releases & Deployments ({selectedDeployments.length} selected)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] text-text-secondary hover:text-white underline transition-colors"
                    >
                      {selectedDeployments.length === deployments.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={fetchDeployments}
                      disabled={loadingDeployments}
                      className="p-1 rounded text-text-secondary hover:text-white transition-colors"
                      title="Refresh deployments"
                    >
                      <RefreshCw size={13} className={loadingDeployments ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {loadingDeployments ? (
                  <div className="py-8 flex flex-col items-center justify-center text-text-tertiary gap-2">
                    <Loader2 size={20} className="animate-spin text-purple-400" />
                    <span className="text-xs">Reading Git commit history...</span>
                  </div>
                ) : deployments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-text-secondary">
                    No recent commits found. You can still type custom notes below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {deployments.map((d) => {
                      const isSelected = selectedDeployments.includes(d.message);
                      return (
                        <div
                          key={d.hash + d.message}
                          onClick={() => toggleDeployment(d.message)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-purple-950/20 border-purple-500/50 text-white'
                              : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-white/15'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="mt-0.5 rounded border-white/20 bg-black/40 text-purple-600 focus:ring-0 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs text-white leading-snug line-clamp-2">
                              {d.message}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-text-tertiary font-mono">
                              <span className="text-purple-400">{d.hash}</span>
                              <span>•</span>
                              <span>{d.date}</span>
                              <span>•</span>
                              <span className="text-text-secondary">{d.category}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tone & Additional Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Broadcast Tone</label>
                  <Select
                    value={tone}
                    onChange={(val) => setTone(val)}
                    options={TONE_OPTIONS}
                    buttonClassName="py-2.5 bg-black/50 border border-white/10 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Additional Admin Notes / Highlights (Optional)</label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Highlight 60fps canvas engine and invite feedback..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateAnnouncement}
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <><Loader2 size={16} className="animate-spin" /> AI Radahn is Composing...</>
                  ) : (
                    <><Sparkles size={16} /> Generate Feature Announcement</>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ================= MODE 2: REFINE & MODIFY CURRENT DRAFT ================= */}
          {mode === 'REFINE' && (
            <div className="space-y-5">
              
              {/* Context Summary */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                  <FileText size={14} className="text-accent-blue" />
                  <span>Current Broadcast Context</span>
                </div>
                <div className="p-3 bg-black/60 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[11px] font-bold text-white">
                    Subject: <span className="text-accent-blue font-normal">{currentSubject || '(No subject set yet)'}</span>
                  </div>
                  <div className="text-[11px] text-text-tertiary truncate">
                    Body: {currentBody ? currentBody.replace(/<[^>]+>/g, ' ').slice(0, 100) + '...' : '(No body set yet)'}
                  </div>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Quick Refinement Actions</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Make it more concise and punchy',
                    'Change tone to professional executive style',
                    'Highlight speed, performance & 60fps responsiveness',
                    'Add a clear call to action to open dashboard',
                    'Format list items with bullet points and bold headers',
                    'Ensure zero emojis and sleek B2B dark aesthetic'
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setRefineInstruction(quick)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-text-secondary hover:text-white transition-all text-left"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  How should AI Radahn modify this email?
                </label>
                <textarea
                  rows={3}
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  placeholder="e.g. Restructure the list into 3 distinct sections with bold headlines, simplify the greeting, and add a note about scheduled maintenance..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateRefinement}
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-accent-blue to-purple-600 hover:opacity-90 text-white flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <><Loader2 size={16} className="animate-spin" /> AI Radahn is Refining...</>
                  ) : (
                    <><Wand2 size={16} /> Generate Modified Draft</>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ================= GENERATED APPROVAL PREVIEW SECTION ================= */}
          {generatedOutput && (
            <div className="pt-6 border-t border-white/10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              
              <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-purple-400 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Review & Approve AI Radahn Output</h4>
                    <p className="text-[11px] text-purple-200">
                      Inspect the generated subject and email layout below before applying to your live composer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('rendered')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        previewTab === 'rendered' ? 'bg-white/15 text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      <Eye size={12} /> Rendered
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('code')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                        previewTab === 'code' ? 'bg-white/15 text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      <Code size={12} /> Raw HTML
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject Review */}
              <div className="p-3.5 bg-black/60 border border-white/10 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">Generated Subject</span>
                <div className="text-sm font-semibold text-white break-words">
                  {generatedOutput.subject}
                </div>
              </div>

              {/* Body Review */}
              <div className="p-4 sm:p-5 bg-black/60 border border-white/10 rounded-xl max-h-72 overflow-y-auto custom-scrollbar">
                {previewTab === 'rendered' ? (
                  <div 
                    className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3
                      [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-1.5 
                      [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5 
                      [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-purple-300 [&_h3]:mt-3 [&_h3]:mb-1 
                      [&_p]:text-text-secondary [&_p]:leading-relaxed [&_p]:mb-2
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-text-secondary 
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:text-text-secondary 
                      [&_strong]:text-white [&_strong]:font-semibold 
                      [&_em]:text-accent-blue [&_em]:not-italic [&_em]:font-medium"
                    dangerouslySetInnerHTML={{ __html: generatedOutput.body }}
                  />
                ) : (
                  <pre className="text-[11px] font-mono text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {generatedOutput.body}
                  </pre>
                )}
              </div>

              {/* Final Approval Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedOutput(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Discard & Try Again
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Check size={16} /> Accept & Apply to Broadcast
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-text-tertiary shrink-0">
          <span className="flex items-center gap-1.5">
            <Zap size={13} className="text-purple-400" /> Powered by Automatix AI Radahn
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
