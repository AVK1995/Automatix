'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  Eye,
  Code,
  Shield,
  Zap,
  FileText,
  Rocket,
  Check,
  Wand2,
  RotateCcw,
  Eraser,
  SendHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';

const TONE_OPTIONS = [
  {
    value: 'modern_dark',
    label: 'Modern Dark Obsidian',
    icon: <Zap size={14} className="text-purple-400 shrink-0" />
  },
  {
    value: 'cyber_glow',
    label: 'Cyber Glow & Neon Blue',
    icon: <Zap size={14} className="text-cyan-400 shrink-0" />
  },
  {
    value: 'enterprise_security',
    label: 'Enterprise Hardened Security',
    icon: <Shield size={14} className="text-emerald-400 shrink-0" />
  },
  {
    value: 'minimalist',
    label: 'Minimalist Clean Monochrome',
    icon: <FileText size={14} className="text-blue-400 shrink-0" />
  },
  {
    value: 'luxury_executive',
    label: 'Executive VIP Luxury',
    icon: <Rocket size={14} className="text-indigo-400 shrink-0" />
  }
];

const QUICK_PRESETS = [
  'Modern dark mode with glowing purple CTA button and security notice',
  'Enterprise security advisory with 24-hour expiration disclaimer',
  'Clean minimalist card with high-contrast button and footer tokens',
  'Tactical military stealth styling with camo lime green CTA without eyebrow',
  'Retro sunset neon synthwave aesthetic with glowing button'
];

// Injects custom dark scrollbar and eliminates horizontal overflow inside iframe previews
function injectIframeTheme(html = '') {
  const iframeScrollbarStyles = `
    <style id="automatix-preview-theme">
      html, body {
        overflow-x: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        background-color: #050505 !important;
      }
      * {
        box-sizing: border-box !important;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: #09090b;
      }
      ::-webkit-scrollbar-thumb {
        background: #27272a;
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #3f3f46;
      }
    </style>
  `;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${iframeScrollbarStyles}</head>`);
  }
  return `${iframeScrollbarStyles}${html}`;
}

export default function AiRadahnTemplateModal({
  isOpen,
  onClose,
  currentTemplate = '',
  onApply
}) {
  const [instruction, setInstruction] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [tone, setTone] = useState('modern_dark');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [previewTab, setPreviewTab] = useState('rendered'); // 'rendered' | 'code'

  useEffect(() => {
    if (isOpen) {
      setGeneratedTemplate('');
      setInstruction('');
      setRefinePrompt('');
      setPreviewTab('rendered');
    }
  }, [isOpen]);

  const handleGenerate = async (customPromptOverride) => {
    const promptToUse = typeof customPromptOverride === 'string' ? customPromptOverride : instruction;
    if (!promptToUse.trim()) {
      return toast.error('Please enter a description or prompt for your template.');
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/ai-radahn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'TRANSACTIONAL_TEMPLATE',
          instruction: promptToUse,
          tone,
          body: ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate template');

      const templateHtml = data.template || data.body || '';
      setGeneratedTemplate(templateHtml);
      toast.success('AI Radahn composed the transactional email template!');
    } catch (e) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim()) {
      return toast.error('Please describe what changes you want to make.');
    }

    setIsRefining(true);
    try {
      const res = await fetch('/api/admin/ai-radahn/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'TRANSACTIONAL_TEMPLATE',
          instruction: `Refinement Request: ${refinePrompt}`,
          tone,
          body: generatedTemplate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refine template');

      const templateHtml = data.template || data.body || '';
      setGeneratedTemplate(templateHtml);
      setRefinePrompt('');
      toast.success('AI Radahn refined the template as requested!');
    } catch (e) {
      toast.error(e.message || 'Refinement failed');
    } finally {
      setIsRefining(false);
    }
  };

  const handleClear = () => {
    setGeneratedTemplate('');
    setRefinePrompt('');
    toast.success('Cleared template. You can generate a new one from scratch.');
  };

  const handleApprove = () => {
    if (!generatedTemplate) return;
    onApply(generatedTemplate);
    toast.success('Applied AI Radahn template to editor!');
    onClose();
  };

  if (!isOpen) return null;

  const renderedPreviewHtml = injectIframeTheme(
    generatedTemplate
      .replace(/\{\{SETUP_LINK\}\}/g, 'https://automatix.ai/setup-password?token=example_secure_token')
      .replace(/\{\{USER_EMAIL\}\}/g, 'user@example.com')
      .replace(/\{\{USER_NAME\}\}/g, 'Alex Johnson')
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        className={`bg-[#111111] border border-white/10 rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 ${
          generatedTemplate ? 'max-w-6xl max-h-[94vh]' : 'max-w-2xl max-h-[90vh]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Optimized for Mobile & Desktop */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black relative flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 pr-8 sm:pr-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0 mt-0.5 sm:mt-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-snug">
                  AI Radahn Template Architect
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 whitespace-nowrap">
                  AI Radahn Brain
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2 sm:line-clamp-none">
                Generate production-ready, dark-themed transactional HTML email templates with embedded &#123;&#123;SETUP_LINK&#125;&#125; and &#123;&#123;USER_EMAIL&#125;&#125; tokens.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:static p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-3.5 sm:p-5 md:p-6">
          <div className={`grid gap-5 sm:gap-6 ${generatedTemplate ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
            
            {/* Left Column: Prompt & Controls */}
            <div className={`space-y-4 ${generatedTemplate ? 'lg:col-span-5' : 'w-full'}`}>
              
              {/* Tone Selector */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Design Style & Tone</label>
                <Select
                  value={tone}
                  onChange={setTone}
                  options={TONE_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Quick Design Prompts</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setInstruction(preset);
                        handleGenerate(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-text-secondary hover:text-white transition-all text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-secondary">
                    Describe layout, theme, and security rules:
                  </label>
                  {instruction && (
                    <button
                      type="button"
                      onClick={() => setInstruction('')}
                      className="text-[11px] text-text-tertiary hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eraser size={12} /> Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={generatedTemplate ? 3 : 4}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g. Design a sleek dark mode password reset email with glowing purple button, security advisory box, and 24-hour expiry disclaimer..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed placeholder:text-text-tertiary"
                />
              </div>

              {/* Generate / Re-generate Action Button */}
              <div className="flex items-center gap-2 pt-0.5">
                {generatedTemplate && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-secondary hover:text-rose-300 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || isRefining}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-accent-blue hover:from-purple-500 hover:to-accent-blue/90 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <><Loader2 size={15} className="animate-spin" /> Generating Template...</>
                  ) : (
                    <><Sparkles size={15} /> {generatedTemplate ? 'Re-Generate Template' : 'Generate HTML Template'}</>
                  )}
                </button>
              </div>

              {/* Iterative Refinement Section (Shown when generated) */}
              {generatedTemplate && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Wand2 size={13} /> Tweak & Refine Current Template
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={refinePrompt}
                      onChange={(e) => setRefinePrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRefine();
                        }
                      }}
                      placeholder="e.g. Change button to orange, remove eyebrow..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handleRefine}
                      disabled={isRefining || isGenerating || !refinePrompt.trim()}
                      className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer shrink-0"
                    >
                      {isRefining ? <Loader2 size={13} className="animate-spin" /> : <SendHorizontal size={13} />}
                      Refine
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Live Rendered Preview & Code (Shown when generated) */}
            {generatedTemplate && (
              <div className="lg:col-span-7 space-y-3 flex flex-col min-w-0">
                
                {/* Preview Tabs & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#161616] border border-white/10 p-2 rounded-xl shrink-0">
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('rendered')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        previewTab === 'rendered' ? 'bg-purple-600 text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      <Eye size={13} />
                      Rendered Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('code')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        previewTab === 'code' ? 'bg-purple-600 text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    >
                      <Code size={13} />
                      Semantic HTML
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                  >
                    <Check size={14} />
                    Approve & Apply to Template
                  </button>
                </div>

                {/* Preview Window (Sandboxed iframe with custom dark scrollbar & zero horizontal overflow) */}
                {previewTab === 'rendered' ? (
                  <div className="w-full bg-[#050505] border border-white/10 rounded-xl overflow-hidden min-h-[380px] max-h-[500px] h-[440px] flex shadow-inner">
                    <iframe
                      srcDoc={renderedPreviewHtml}
                      title="AI Radahn Live Template Preview"
                      className="w-full h-full border-0 bg-[#050505] custom-scrollbar"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={16}
                      value={generatedTemplate}
                      onChange={(e) => setGeneratedTemplate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 resize-none leading-relaxed min-h-[380px] custom-scrollbar"
                    />
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

        {/* Modal Footer - Responsive */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-text-tertiary order-2 sm:order-1 text-center sm:text-left">
            Powered by Automatix AI Radahn
          </span>

          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-text-secondary hover:text-white transition-colors cursor-pointer rounded-lg bg-white/5 sm:bg-transparent text-center"
            >
              Close
            </button>

            {generatedTemplate && (
              <button
                type="button"
                onClick={handleApprove}
                className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
              >
                <Check size={14} />
                Approve & Apply to Template
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
