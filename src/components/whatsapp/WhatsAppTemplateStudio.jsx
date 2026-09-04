'use client';

import { useState } from 'react';
import { 
  Smartphone, 
  Send, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  Phone, 
  MessageSquare, 
  Globe, 
  Sparkles, 
  Loader2,
  Check,
  Tag,
  Clock,
  ArrowRight
} from 'lucide-react';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { createWhatsAppTemplate } from '@/actions/whatsapp';

export default function WhatsAppTemplateStudio({ connectionId, onTemplateCreated }) {
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('MARKETING'); // 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  const [language, setLanguage] = useState('en_US');
  const [headerType, setHeaderType] = useState('NONE'); // 'NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'
  const [headerText, setHeaderText] = useState('');
  const [headerMediaSample, setHeaderMediaSample] = useState('');
  const [bodyText, setBodyText] = useState('Hello {{1}}, your order {{2}} has been confirmed and is on the way!');
  const [sampleVariables, setSampleVariables] = useState({ '1': 'Alex', '2': 'ORD-9842' });
  const [footerText, setFooterText] = useState('Reply STOP to unsubscribe');
  const [buttonsType, setButtonsType] = useState('QUICK_REPLY'); // 'NONE', 'QUICK_REPLY', 'CTA'
  const [quickReplies, setQuickReplies] = useState(['Track Order', 'Contact Support']);
  const [ctaType, setCtaType] = useState('URL'); // 'URL' | 'PHONE_NUMBER'
  const [ctaText, setCtaText] = useState('View Website');
  const [ctaValue, setCtaValue] = useState('https://example.com');

  // Insert variable into body text
  const handleAddVariable = () => {
    // Count existing {{n}} matches
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const nextIndex = matches.length + 1;
    setBodyText(prev => `${prev} {{${nextIndex}}}`);
    setSampleVariables(prev => ({ ...prev, [String(nextIndex)]: `Sample ${nextIndex}` }));
  };

  // Replace {{1}}, {{2}} with sample variable text for live preview
  const getRenderedBody = () => {
    let preview = bodyText || '';
    Object.keys(sampleVariables).forEach(key => {
      preview = preview.split(`{{${key}}}`).join(sampleVariables[key] || `[Variable ${key}]`);
    });
    return preview;
  };

  // Submit to Meta
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error('Template Name is required.');
      return;
    }

    if (!bodyText.trim()) {
      toast.error('Body text is required.');
      return;
    }

    setLoading(true);

    try {
      // Build Meta components array
      const components = [];

      // 1. Header
      if (headerType === 'TEXT' && headerText.trim()) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: headerText.trim()
        });
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        components.push({
          type: 'HEADER',
          format: headerType,
          example: headerMediaSample.trim() ? { header_handle: [headerMediaSample.trim()] } : undefined
        });
      }

      // 2. Body
      // Meta requires body example if variables are present
      const varMatches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
      const bodyComponent = {
        type: 'BODY',
        text: bodyText.trim()
      };

      if (varMatches.length > 0) {
        const bodyExamples = Object.keys(sampleVariables)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => sampleVariables[k] || 'Sample');
        
        if (bodyExamples.length > 0) {
          bodyComponent.example = {
            body_text: [bodyExamples]
          };
        }
      }
      components.push(bodyComponent);

      // 3. Footer
      if (footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: footerText.trim()
        });
      }

      // 4. Buttons
      if (buttonsType === 'QUICK_REPLY' && quickReplies.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: quickReplies.filter(Boolean).map(text => ({
            type: 'QUICK_REPLY',
            text: text.slice(0, 25)
          }))
        });
      } else if (buttonsType === 'CTA' && ctaText.trim()) {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: ctaType,
              text: ctaText.slice(0, 25),
              [ctaType === 'URL' ? 'url' : 'phone_number']: ctaValue.trim()
            }
          ]
        });
      }

      const res = await createWhatsAppTemplate(connectionId, {
        name: templateName,
        category,
        language,
        components
      });

      if (res.success) {
        toast.success(`Template "${res.template.templateName}" submitted to Meta for review!`);
        if (onTemplateCreated) onTemplateCreated(res.template);
        setTemplateName('');
      } else {
        toast.error(res.error || 'Failed to create template.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during template creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
      {/* LEFT COLUMN: FORM BUILDER (7 Cols) */}
      <div className="xl:col-span-7 space-y-6">
        <form onSubmit={handleSubmit} className="bg-[#111] border border-border-subtle rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              Craft Meta WhatsApp Template
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Design your template components and submit directly to Meta Cloud API for instant approval.
            </p>
          </div>

          {/* Basic Template Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Template Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="order_confirmation"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
              <p className="text-[10px] text-text-tertiary mt-1">Lowercase, numbers, underscores only.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Category
              </label>
              <Select
                value={category}
                onChange={(val) => setCategory(val)}
                options={[
                  { value: 'MARKETING', label: 'Marketing (Promotions & Offers)' },
                  { value: 'UTILITY', label: 'Utility (Order, Account, Alerts)' },
                  { value: 'AUTHENTICATION', label: 'Authentication (OTPs & Security)' }
                ]}
                className="w-full text-xs"
                buttonClassName="py-2 bg-black/40 border-white/10 text-xs rounded-xl"
              />
              <p className="text-[10px] text-text-tertiary mt-1">Utility templates have lower Meta fees.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                Language
              </label>
              <Select
                value={language}
                onChange={(val) => setLanguage(val)}
                options={[
                  { value: 'en_US', label: 'English (US)' },
                  { value: 'en_GB', label: 'English (UK)' },
                  { value: 'hi_IN', label: 'Hindi (India)' },
                  { value: 'es_ES', label: 'Spanish (ES)' },
                  { value: 'pt_BR', label: 'Portuguese (BR)' },
                  { value: 'fr_FR', label: 'French (FR)' },
                  { value: 'de_DE', label: 'German (DE)' }
                ]}
                className="w-full text-xs"
                buttonClassName="py-2 bg-black/40 border-white/10 text-xs rounded-xl"
              />
              <p className="text-[10px] text-text-tertiary mt-1">Language code for Meta template.</p>
            </div>
          </div>

          {/* Header Component */}
          <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Header (Optional)
              </label>
              <span className="text-[10px] text-text-tertiary">Text or Rich Media Banner</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'NONE', label: 'None', icon: null },
                { id: 'TEXT', label: 'Text', icon: FileText },
                { id: 'IMAGE', label: 'Image', icon: ImageIcon },
                { id: 'VIDEO', label: 'Video', icon: Video },
                { id: 'DOCUMENT', label: 'PDF / Doc', icon: FileText },
              ].map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHeaderType(h.id)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    headerType === h.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/5 bg-black/30 text-text-secondary hover:text-white'
                  }`}
                >
                  {h.icon && <h.icon size={13} />}
                  <span>{h.label}</span>
                </button>
              ))}
            </div>

            {headerType === 'TEXT' && (
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. Order Update or Special Announcement"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            )}

            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
              <div>
                <input
                  type="url"
                  value={headerMediaSample}
                  onChange={(e) => setHeaderMediaSample(e.target.value)}
                  placeholder="Sample Media URL (e.g. https://example.com/banner.jpg for Meta review)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-text-tertiary mt-1">Meta requires a sample public media file URL during approval review.</p>
              </div>
            )}
          </div>

          {/* Body Component */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Message Body <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddVariable}
                className="text-[11px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold"
              >
                <Plus size={12} /> Add Variable
              </button>
            </div>

            <textarea
              rows={4}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Type your message here. Use {{1}}, {{2}} for dynamic variables..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
              required
            />
            <p className="text-[10px] text-text-tertiary">
              Formatting: Use <code className="text-emerald-400">*bold*</code>, <code className="text-emerald-400">_italics_</code>, <code className="text-emerald-400">~strikethrough~</code>. Variables are written as <code className="text-emerald-400">{'{{1}}'}</code>, <code className="text-emerald-400">{'{{2}}'}</code>.
            </p>

            {/* Variable Sample Values (Required by Meta) */}
            {Object.keys(sampleVariables).length > 0 && (
              <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  Meta Sample Values (For Approval Review):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(sampleVariables).map(num => (
                    <div key={num} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                        {`{{${num}}}`}
                      </span>
                      <input
                        type="text"
                        value={sampleVariables[num]}
                        onChange={(e) => setSampleVariables({ ...sampleVariables, [num]: e.target.value })}
                        placeholder={`Sample value for {{${num}}}`}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Component */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Footer Text (Optional)
              </label>
              <span className="text-[10px] text-text-tertiary">Subtle disclaimer / opt-out</span>
            </div>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. Reply STOP to unsubscribe or Powered by Automatix"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons Component */}
          <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Interactive Buttons (Optional)
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'NONE', label: 'No Buttons' },
                { id: 'QUICK_REPLY', label: 'Quick Reply Buttons' },
                { id: 'CTA', label: 'Call to Action (URL/Phone)' },
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setButtonsType(b.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                    buttonsType === b.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/5 bg-black/30 text-text-secondary hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {buttonsType === 'QUICK_REPLY' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-tertiary">Add up to 3 quick response buttons:</span>
                  {quickReplies.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setQuickReplies([...quickReplies, 'New Button'])}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus size={10} /> Add Button
                    </button>
                  )}
                </div>
                {quickReplies.map((reply, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={25}
                      value={reply}
                      onChange={(e) => {
                        const updated = [...quickReplies];
                        updated[idx] = e.target.value;
                        setQuickReplies(updated);
                      }}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickReplies(quickReplies.filter((_, i) => i !== idx))}
                      className="p-1.5 text-text-tertiary hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {buttonsType === 'CTA' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] text-text-tertiary uppercase font-bold mb-1">Type</label>
                  <Select
                    value={ctaType}
                    onChange={(val) => setCtaType(val)}
                    options={[
                      { value: 'URL', label: 'Website URL' },
                      { value: 'PHONE_NUMBER', label: 'Phone Call' }
                    ]}
                    className="w-full text-xs"
                    buttonClassName="py-1.5 bg-black/40 border-white/10 text-xs rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-tertiary uppercase font-bold mb-1">Button Label</label>
                  <input
                    type="text"
                    maxLength={25}
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Visit Website"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-tertiary uppercase font-bold mb-1">Target Link / Phone</label>
                  <input
                    type="text"
                    value={ctaValue}
                    onChange={(e) => setCtaValue(e.target.value)}
                    placeholder={ctaType === 'URL' ? 'https://...' : '+15551234567'}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>{loading ? 'Submitting to Meta...' : 'Submit Template to Meta for Approval'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: LIVE INTERACTIVE SMARTPHONE MOCKUP (5 Cols) */}
      <div className="xl:col-span-5 flex flex-col items-center justify-start sticky top-8">
        <div className="w-full max-w-[360px] space-y-3">
          <div className="flex items-center justify-between text-xs text-text-secondary px-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-emerald-400">
              <Smartphone size={14} /> Live Smartphone Preview
            </span>
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">
              {category}
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-full bg-[#0b141a] border-[8px] border-[#222] rounded-[42px] shadow-2xl overflow-hidden flex flex-col min-h-[580px] relative">
            {/* Camera Notch */}
            <div className="w-28 h-4 bg-[#222] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20" />

            {/* WhatsApp App Top Bar */}
            <div className="bg-[#1f2c34] text-white pt-6 pb-3 px-4 flex items-center justify-between z-10 border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                  WA
                </div>
                <div>
                  <h4 className="text-xs font-semibold leading-tight">Your Business</h4>
                  <p className="text-[9px] text-emerald-400 font-medium">Verified Business</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-text-tertiary">
                <Phone size={14} />
                <Globe size={14} />
              </div>
            </div>

            {/* Chat Wallpaper Canvas */}
            <div className="flex-1 p-3 flex flex-col justify-end bg-[#0b141a] relative overflow-hidden">
              {/* Subtle background doodle pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#25d366_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* WhatsApp Message Bubble */}
              <div className="bg-[#1f2c34] text-white rounded-2xl rounded-tl-none max-w-[92%] shadow-lg border border-[#2a3942]/60 overflow-hidden relative z-10 animate-in fade-in duration-150">
                {/* Header Render */}
                {headerType === 'TEXT' && headerText && (
                  <div className="p-3 pb-1 font-bold text-xs text-white border-b border-white/5">
                    {headerText}
                  </div>
                )}
                {headerType === 'IMAGE' && (
                  <div className="w-full h-36 bg-[#2a3942] flex flex-col items-center justify-center text-text-tertiary text-xs gap-1">
                    <ImageIcon size={28} className="opacity-60" />
                    <span className="text-[10px]">Image Header</span>
                  </div>
                )}
                {headerType === 'VIDEO' && (
                  <div className="w-full h-36 bg-[#2a3942] flex flex-col items-center justify-center text-text-tertiary text-xs gap-1">
                    <Video size={28} className="opacity-60" />
                    <span className="text-[10px]">Video Header</span>
                  </div>
                )}
                {headerType === 'DOCUMENT' && (
                  <div className="p-3 bg-[#111b21] flex items-center gap-2 border-b border-white/5">
                    <FileText size={20} className="text-emerald-400" />
                    <span className="text-xs text-text-secondary font-mono truncate">document.pdf</span>
                  </div>
                )}

                {/* Body Render */}
                <div className="p-3 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                  {getRenderedBody() || <span className="text-text-tertiary italic">Type message body...</span>}
                </div>

                {/* Footer Render */}
                {footerText && (
                  <div className="px-3 pb-2 text-[10px] text-text-tertiary font-sans">
                    {footerText}
                  </div>
                )}

                {/* Time & Double Checkmarks */}
                <div className="px-3 pb-1.5 flex items-center justify-end gap-1 text-[9px] text-text-tertiary">
                  <span>10:42 AM</span>
                  <span className="text-emerald-400 flex">✓✓</span>
                </div>

                {/* Interactive Buttons Render */}
                {buttonsType === 'QUICK_REPLY' && quickReplies.length > 0 && (
                  <div className="border-t border-[#2a3942] divide-y divide-[#2a3942]">
                    {quickReplies.filter(Boolean).map((btn, i) => (
                      <div key={i} className="py-2 px-3 text-center text-xs font-semibold text-[#53bdeb] hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5">
                        <MessageSquare size={12} />
                        <span>{btn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {buttonsType === 'CTA' && ctaText && (
                  <div className="border-t border-[#2a3942]">
                    <div className="py-2 px-3 text-center text-xs font-semibold text-[#53bdeb] hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5">
                      {ctaType === 'URL' ? <Globe size={12} /> : <Phone size={12} />}
                      <span>{ctaText}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Input Area Mock */}
            <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-[#2a3942]">
              <div className="flex-1 bg-[#2a3942] rounded-full py-1.5 px-3 text-[11px] text-text-tertiary">
                Message...
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Send size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
