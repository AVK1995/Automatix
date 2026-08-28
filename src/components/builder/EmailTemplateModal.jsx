'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Mail, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  RotateCcw, 
  Code, 
  FileText, 
  Palette, 
  Sliders, 
  Eye, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  DEFAULT_EMAIL_TEMPLATE, 
  SAMPLE_PREVIEW_DATA, 
  renderHtmlEmailTemplate, 
  renderTextEmailTemplate, 
  substitutePlaceholders 
} from '@/utils/emailTemplate';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';

const FONT_OPTIONS = [
  { value: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', label: 'Plus Jakarta Sans (Modern Clean)' },
  { value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', label: 'Inter (Neutral Sans)' },
  { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', label: 'System UI / San Francisco (Apple)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia (Classic Editorial Serif)' },
  { value: 'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace', label: 'Monospace (Technical Code)' }
];

const VARIABLE_TAGS = [
  { tag: '{{invitee_name}}', label: 'Invitee Name' },
  { tag: '{{calendar_name}}', label: 'Calendar Name' },
  { tag: '{{date}}', label: 'Date' },
  { tag: '{{time}}', label: 'Time' },
  { tag: '{{timezone}}', label: 'Timezone' },
  { tag: '{{meet_url}}', label: 'Meeting Link' },
  { tag: '{{location}}', label: 'Location' },
  { tag: '{{host_name}}', label: 'Host Name' },
];

export default function EmailTemplateModal({ calendar, emailTemplate, onChange, onClose }) {
  const [template, setTemplate] = useState(() => ({
    ...DEFAULT_EMAIL_TEMPLATE,
    ...(emailTemplate || {})
  }));

  const [activeTab, setActiveTab] = useState(template.type || 'html'); // 'html' | 'text'
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isDarkModePreview, setIsDarkModePreview] = useState(false);
  const [showRawHtmlEditor, setShowRawHtmlEditor] = useState(template.isRawHtml || false);

  const handleUpdate = (field, val) => {
    setTemplate(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleInsertTag = (tag, targetField = 'subject') => {
    const currentVal = template[targetField] || '';
    handleUpdate(targetField, currentVal + ' ' + tag);
    toast.success(`Inserted ${tag}`);
  };

  const handleResetDefault = () => {
    setTemplate({
      ...DEFAULT_EMAIL_TEMPLATE,
      type: activeTab
    });
    toast.success('Reset to default template');
  };

  const handleSave = () => {
    const finalTemplate = {
      ...template,
      type: activeTab,
      isRawHtml: showRawHtmlEditor
    };
    onChange(finalTemplate);
    toast.success('Email template updated successfully!');
    onClose();
  };

  // Render preview HTML string
  const renderedHtml = useMemo(() => {
    return renderHtmlEmailTemplate({
      template,
      calendar,
      data: SAMPLE_PREVIEW_DATA,
      isDarkMode: isDarkModePreview
    });
  }, [template, calendar, isDarkModePreview]);

  // Render preview Text string
  const renderedText = useMemo(() => {
    return renderTextEmailTemplate({
      template,
      calendar,
      data: SAMPLE_PREVIEW_DATA
    });
  }, [template, calendar]);

  const subjectPreview = useMemo(() => {
    return substitutePlaceholders(template.subject || DEFAULT_EMAIL_TEMPLATE.subject, {
      ...SAMPLE_PREVIEW_DATA,
      calendar_name: calendar.name || SAMPLE_PREVIEW_DATA.calendar_name
    });
  }, [template.subject, calendar.name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-6xl h-[94vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Confirmation Email Template</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                  Cross-Client Ready
                </span>
              </div>
              <p className="text-xs text-text-secondary">Customize subject, fonts, and responsive layout for all email inboxes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Switcher */}
            <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('html');
                  handleUpdate('type', 'html');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'html'
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Rich HTML Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  handleUpdate('type', 'text');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'text'
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Plain Text Email
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2-Column Responsive Editor & Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Settings & Content Editor (5 cols) */}
          <div className="lg:col-span-5 border-r border-white/10 p-5 overflow-y-auto space-y-5 custom-scrollbar bg-black/20">
            
            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white">Email Subject Line</label>
                <span className="text-[10px] text-text-tertiary">Dynamic variables supported</span>
              </div>
              <input 
                type="text"
                value={template.subject || ''}
                onChange={(e) => handleUpdate('subject', e.target.value)}
                placeholder="Confirmed: {{calendar_name}} on {{date}}"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-medium"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {VARIABLE_TAGS.slice(0, 4).map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleInsertTag(v.tag, 'subject')}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-accent-blue/15 hover:text-accent-blue border border-white/10 text-text-secondary transition-colors"
                  >
                    + {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* If HTML Mode */}
            {activeTab === 'html' ? (
              <>
                {/* Font Selector */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Typography / Font Style</label>
                  <Select 
                    value={template.fontFamily || FONT_OPTIONS[0].value}
                    onChange={(val) => handleUpdate('fontFamily', val)}
                    options={FONT_OPTIONS}
                  />
                </div>

                {/* Raw HTML Code Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
                  <div>
                    <span className="text-xs font-semibold text-white block">Raw HTML Code Mode</span>
                    <span className="text-[11px] text-text-tertiary">Write or paste your own custom responsive HTML</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRawHtmlEditor(!showRawHtmlEditor)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      showRawHtmlEditor
                        ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
                        : 'bg-white/5 text-text-secondary border-white/10 hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 inline mr-1" />
                    {showRawHtmlEditor ? 'Using Code' : 'Enable Code'}
                  </button>
                </div>

                {showRawHtmlEditor ? (
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1.5">Custom HTML Body</label>
                    <textarea 
                      rows={14}
                      value={template.customHtml || renderedHtml}
                      onChange={(e) => handleUpdate('customHtml', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-accent-blue resize-none custom-scrollbar"
                      placeholder="<!DOCTYPE html>..."
                    />
                  </div>
                ) : (
                  <>
                    {/* Visual Template Fields */}
                    <div className="space-y-3.5 p-4 rounded-xl bg-black/30 border border-white/5">
                      <div>
                        <label className="block text-xs font-semibold text-white mb-1">Headline Text</label>
                        <input 
                          type="text"
                          value={template.headline || ''}
                          onChange={(e) => handleUpdate('headline', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
                          placeholder="Your Meeting is Confirmed!"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white mb-1">Intro Message / Greeting</label>
                        <textarea 
                          rows={2}
                          value={template.introNote || ''}
                          onChange={(e) => handleUpdate('introNote', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue resize-none"
                          placeholder="We look forward to speaking with you..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white mb-1">CTA Button Text</label>
                        <input 
                          type="text"
                          value={template.ctaText || 'Join Video Meeting'}
                          onChange={(e) => handleUpdate('ctaText', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
                          placeholder="Join Video Meeting"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white mb-1">Footer Instructions</label>
                        <textarea 
                          rows={2}
                          value={template.footerNote || ''}
                          onChange={(e) => handleUpdate('footerNote', e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue resize-none"
                          placeholder="Need to reschedule? Simply reply to this email."
                        />
                      </div>
                    </div>

                    {/* Section Visibility Toggles */}
                    <div className="space-y-2.5 p-4 rounded-xl bg-black/30 border border-white/5">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Sections Included</label>
                      <Checkbox 
                        checked={template.showLogo !== false}
                        onChange={(checked) => handleUpdate('showLogo', checked)}
                        label="Include Company Logo in Header"
                      />
                      <Checkbox 
                        checked={template.showDetailsCard !== false}
                        onChange={(checked) => handleUpdate('showDetailsCard', checked)}
                        label="Include Meeting Details Card (Date, Time, Location)"
                      />
                      <Checkbox 
                        checked={template.showCtaButton !== false}
                        onChange={(checked) => handleUpdate('showCtaButton', checked)}
                        label="Include Join Meeting CTA Button"
                      />
                      <Checkbox 
                        checked={template.showAnswers !== false}
                        onChange={(checked) => handleUpdate('showAnswers', checked)}
                        label="Include Invitee Submitted Answers"
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Plain Text Editor */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-white">Plain Text Email Body</label>
                  <span className="text-[10px] text-text-tertiary">Fast & Minimalist</span>
                </div>
                <textarea 
                  rows={14}
                  value={template.textBody || ''}
                  onChange={(e) => handleUpdate('textBody', e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-accent-blue resize-none custom-scrollbar"
                  placeholder="Hi {{invitee_name}}..."
                />
                
                <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                  <span className="text-[11px] font-semibold text-text-secondary block mb-1.5">Click tag to insert into text:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {VARIABLE_TAGS.map(v => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => handleInsertTag(v.tag, 'textBody')}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 hover:bg-accent-blue/20 hover:text-accent-blue border border-white/10 text-text-secondary transition-colors"
                      >
                        + {v.tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Email Inbox Simulation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
            
            {/* Preview Controls Bar */}
            <div className="p-3 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              
              {/* Device Tabs */}
              <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    deviceView === 'desktop' ? 'bg-white/15 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                  }`}
                  title="Desktop View (Gmail / Outlook)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('tablet')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    deviceView === 'tablet' ? 'bg-white/15 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                  }`}
                  title="Tablet View (iPad)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('mobile')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    deviceView === 'mobile' ? 'bg-white/15 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                  }`}
                  title="Mobile View (iPhone / Android)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </button>
              </div>

              {/* Theme Mode Toggle */}
              {activeTab === 'html' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-tertiary">Inbox Theme:</span>
                  <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsDarkModePreview(false)}
                      className={`p-1.5 rounded-md text-xs transition-all ${
                        !isDarkModePreview ? 'bg-white text-black font-semibold shadow-sm' : 'text-text-tertiary hover:text-white'
                      }`}
                      title="Light Mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDarkModePreview(true)}
                      className={`p-1.5 rounded-md text-xs transition-all ${
                        isDarkModePreview ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-text-tertiary hover:text-white'
                      }`}
                      title="Dark Mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Client Wrapper Simulation */}
            <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center bg-black/30 custom-scrollbar">
              
              <div 
                className={`w-full transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-white/10 flex flex-col ${
                  deviceView === 'mobile' 
                    ? 'max-w-[375px]' 
                    : deviceView === 'tablet' 
                      ? 'max-w-[540px]' 
                      : 'max-w-[680px]'
                }`}
                style={{
                  backgroundColor: isDarkModePreview ? '#161616' : '#ffffff'
                }}
              >
                {/* Simulated Email Client Top Header */}
                <div 
                  className="p-4 border-b text-xs transition-colors shrink-0"
                  style={{
                    backgroundColor: isDarkModePreview ? '#1c1c1c' : '#f8fafc',
                    borderColor: isDarkModePreview ? '#2e2e2e' : '#e2e8f0',
                    color: isDarkModePreview ? '#ffffff' : '#1e293b'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="font-bold text-sm truncate pr-2"
                      style={{ color: isDarkModePreview ? '#ffffff' : '#0f172a' }}
                    >
                      {subjectPreview}
                    </span>
                    <span className="text-[10px] text-text-tertiary shrink-0">10:30 AM (Just now)</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{
                        backgroundColor: calendar.themeColor || '#3B82F6',
                        color: '#ffffff'
                      }}
                    >
                      {(calendar.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs truncate">
                        {calendar.name || 'Automatix Host'} <span className="font-normal opacity-60">&lt;host@example.com&gt;</span>
                      </div>
                      <div className="text-[11px] opacity-70 truncate">
                        To: {SAMPLE_PREVIEW_DATA.invitee_name} &lt;{SAMPLE_PREVIEW_DATA.invitee_email}&gt;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Body Frame */}
                <div className="overflow-x-auto p-0">
                  {activeTab === 'html' ? (
                    <iframe
                      title="Email HTML Preview"
                      srcDoc={renderedHtml}
                      className="w-full min-h-[520px] border-0"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div 
                      className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed min-h-[400px]"
                      style={{
                        backgroundColor: isDarkModePreview ? '#121212' : '#ffffff',
                        color: isDarkModePreview ? '#f4f4f5' : '#18181b'
                      }}
                    >
                      {renderedText}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-bold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors shadow-lg shadow-accent-blue/20"
            >
              <Check className="w-4 h-4" />
              Save Email Template
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
