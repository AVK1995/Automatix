'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createCalendar, updateCalendar, deleteCalendar } from '@/actions/calendars';
import { 
  Calendar as CalendarIcon, 
  Settings2, 
  ExternalLink, 
  Share2,
  Trash2,
  Edit2,
  Plus,
  Clock,
  CheckCircle2,
  Copy,
  Layout,
  Globe,
  X,
  Sparkles,
  Users,
  Code2,
  Palette,
  Layers,
  Check,
  Edit3,
  Wand2,
  Type,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

import QuestionBuilder from '@/components/builder/QuestionBuilder';
import ColorPicker from '@/components/ui/ColorPicker';
import Select from '@/components/ui/Select';
import Radio from '@/components/ui/Radio';
import RichTextEditor from '@/components/ui/RichTextEditor';
import WeeklyScheduleBuilder from '@/components/builder/WeeklyScheduleBuilder';
import Checkbox from '@/components/ui/Checkbox';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmailTemplateModal from '@/components/builder/EmailTemplateModal';
import SmartBrandOptimizerModal from '@/components/builder/SmartBrandOptimizerModal';
import { GOOGLE_FONTS_CATALOG, CALENDAR_THEMES, getResolvedTheme, getContrastColor } from '@/utils/calendarThemes';

function AvailabilityModal({ calendar, onChange, onClose }) {
  const [localCalendar, setLocalCalendar] = useState(calendar);
  const [hasErrors, setHasErrors] = useState(false);

  const handleDone = () => {
    if (hasErrors) {
      toast.error('Please fix the schedule errors before saving.');
      const errorNode = document.querySelector('.border-red-500\\/50');
      if (errorNode) {
        errorNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    onChange(localCalendar);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-xl w-full h-[100dvh] sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-white/10 sticky top-0 bg-[#111]/90 backdrop-blur-md z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent-blue" /> Availability & Schedule
          </h3>
          <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-white rounded-md hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-8 flex-1">
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Date Range</h4>
            <div className="flex flex-col gap-4 text-sm text-text-secondary bg-black/20 p-4 rounded-lg border border-white/5">
              
              <div className="flex flex-col gap-3">
                <Radio 
                  name="dateRangeType"
                  value="days_in_future"
                  checked={(localCalendar.dateRangeType || 'days_in_future') === 'days_in_future'}
                  onChange={() => setLocalCalendar({...localCalendar, dateRangeType: 'days_in_future'})}
                  label={
                    <span className={(localCalendar.dateRangeType || 'days_in_future') === 'days_in_future' ? 'text-white font-medium' : 'group-hover:text-white/80'}>Invitees can schedule...</span>
                  }
                />
                {(localCalendar.dateRangeType || 'days_in_future') === 'days_in_future' && (
                  <div className="flex flex-wrap items-center gap-2 bg-black/30 p-2 rounded-md border border-white/5 ml-6">
                    <input 
                      type="number"
                      min="1"
                      max="365"
                      value={localCalendar.futureLimit || 30}
                      onChange={e => setLocalCalendar({...localCalendar, futureLimit: parseInt(e.target.value) || 30})}
                      className="w-16 bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue text-center"
                    />
                    <Select
                      value={localCalendar.futureLimitType || 'calendar_days'}
                      onChange={val => setLocalCalendar({...localCalendar, futureLimitType: val})}
                      options={[
                        { value: 'calendar_days', label: 'calendar days' },
                        { value: 'business_days', label: 'business days' }
                      ]}
                      className="min-w-[140px]"
                    />
                    <span>into the future</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Radio 
                  name="dateRangeType"
                  value="date_range"
                  checked={localCalendar.dateRangeType === 'date_range'}
                  onChange={() => setLocalCalendar({...localCalendar, dateRangeType: 'date_range'})}
                  label={
                    <span className={localCalendar.dateRangeType === 'date_range' ? 'text-white font-medium' : 'group-hover:text-white/80'}>Within a date range</span>
                  }
                />
                {localCalendar.dateRangeType === 'date_range' && (
                  <div className="flex flex-wrap items-center gap-2 bg-black/30 p-2 rounded-md border border-white/5 ml-6">
                    <input 
                      type="date"
                      value={localCalendar.dateRangeStart ? (typeof localCalendar.dateRangeStart === 'string' ? localCalendar.dateRangeStart.split('T')[0] : new Date(localCalendar.dateRangeStart).toISOString().split('T')[0]) : ''}
                      onChange={e => setLocalCalendar({...localCalendar, dateRangeStart: e.target.value ? new Date(e.target.value).toISOString() : null})}
                      className="bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue [color-scheme:dark]"
                    />
                    <span className="px-1 text-xs uppercase tracking-wider text-text-tertiary">to</span>
                    <input 
                      type="date"
                      value={localCalendar.dateRangeEnd ? (typeof localCalendar.dateRangeEnd === 'string' ? localCalendar.dateRangeEnd.split('T')[0] : new Date(localCalendar.dateRangeEnd).toISOString().split('T')[0]) : ''}
                      onChange={e => setLocalCalendar({...localCalendar, dateRangeEnd: e.target.value ? new Date(e.target.value).toISOString() : null})}
                      className="bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>

              <Radio 
                name="dateRangeType"
                value="indefinite"
                checked={localCalendar.dateRangeType === 'indefinite'}
                onChange={() => setLocalCalendar({...localCalendar, dateRangeType: 'indefinite'})}
                label={
                  <span className={localCalendar.dateRangeType === 'indefinite' ? 'text-white font-medium' : 'group-hover:text-white/80'}>Indefinitely into the future</span>
                }
              />

            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Minimum Notice</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary bg-black/20 p-4 rounded-lg border border-white/5">
              <span>Prevent events less than</span>
              <input 
                type="number"
                min="0"
                max={localCalendar.noticePeriodUnit === 'days' ? 90 : undefined}
                value={localCalendar.noticePeriod ?? 0}
                onChange={e => {
                  let val = parseInt(e.target.value) || 0;
                  if (localCalendar.noticePeriodUnit === 'days' && val > 90) val = 90;
                  setLocalCalendar({...localCalendar, noticePeriod: val});
                }}
                className="w-16 bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue text-center"
              />
              <Select
                value={localCalendar.noticePeriodUnit || 'hours'}
                onChange={val => {
                  let updatedNoticePeriod = localCalendar.noticePeriod;
                  if (val === 'days' && updatedNoticePeriod > 90) updatedNoticePeriod = 90;
                  setLocalCalendar({...localCalendar, noticePeriodUnit: val, noticePeriod: updatedNoticePeriod});
                }}
                options={[
                  { value: 'minutes', label: 'minutes' },
                  { value: 'hours', label: 'hours' },
                  { value: 'days', label: 'days' }
                ]}
                className="min-w-[110px]"
              />
              <span>away.</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Limits and Buffers</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-black/20 p-4 rounded-lg border border-white/5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Event Duration</label>
                <Select 
                  value={String(localCalendar.duration || 30)}
                  onChange={val => setLocalCalendar({...localCalendar, duration: parseInt(val)})}
                  options={[
                    { value: '15', label: '15 mins' },
                    { value: '30', label: '30 mins' },
                    { value: '45', label: '45 mins' },
                    { value: '60', label: '1 hour' },
                    { value: '90', label: '1.5 hours' },
                    { value: '120', label: '2 hours' }
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Before Event</label>
                  <Select 
                    value={String(localCalendar.bufferBefore || 0)}
                    onChange={val => setLocalCalendar({...localCalendar, bufferBefore: parseInt(val)})}
                    options={[
                      { value: '0', label: '0 mins' },
                      { value: '15', label: '15 mins' },
                      { value: '30', label: '30 mins' },
                      { value: '45', label: '45 mins' },
                      { value: '60', label: '1 hour' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">After Event</label>
                  <Select 
                    value={String(localCalendar.bufferAfter || 0)}
                    onChange={val => setLocalCalendar({...localCalendar, bufferAfter: parseInt(val)})}
                    options={[
                      { value: '0', label: '0 mins' },
                      { value: '15', label: '15 mins' },
                      { value: '30', label: '30 mins' },
                      { value: '45', label: '45 mins' },
                      { value: '60', label: '1 hour' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Start time increments</label>
                <Select 
                  value={String(localCalendar.slotIncrement || 30)}
                  onChange={val => setLocalCalendar({...localCalendar, slotIncrement: parseInt(val)})}
                  options={[
                    { value: '5', label: 'Every 5 minutes' },
                    { value: '10', label: 'Every 10 minutes' },
                    { value: '15', label: 'Every 15 minutes' },
                    { value: '20', label: 'Every 20 minutes' },
                    { value: '30', label: 'Every 30 minutes' },
                    { value: '45', label: 'Every 45 minutes' },
                    { value: '60', label: 'Every 60 minutes' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Max bookings per day</label>
                <input 
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={localCalendar.maxBookingsPerDay || ''}
                  onChange={e => setLocalCalendar({...localCalendar, maxBookingsPerDay: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-[9px] text-sm text-white focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <label className="block text-sm font-semibold text-white mb-4">Weekly Schedule</label>
            <WeeklyScheduleBuilder 
              availability={localCalendar.availability || {}}
              onChange={val => setLocalCalendar({...localCalendar, availability: val})}
              onErrorStateChange={setHasErrors}
            />
          </div>
        </div>
        
        <div className="p-4 sm:p-5 border-t border-white/10 sticky bottom-0 bg-[#111]/90 backdrop-blur-md flex justify-end shrink-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={handleDone} className="px-6 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue/90 transition-colors w-full sm:w-auto">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function CssGuideModal({ onClose }) {
  const [copiedSnippet, setCopiedSnippet] = useState('');

  const copyCode = (code, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedSnippet(id);
      toast.success('CSS snippet copied to clipboard!');
      setTimeout(() => setCopiedSnippet(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[88vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
              <Code2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Calendar CSS Customization Guide</h3>
              <p className="text-xs text-text-secondary">Full styling control via CSS Variables & Component Class Selectors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-text-secondary leading-relaxed custom-scrollbar">
          {/* Section 1: CSS Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Palette size={14} className="text-accent-blue" />
                1. Core CSS Theme Variables
              </h4>
              <button 
                onClick={() => copyCode(`:root {
  --cal-accent: #F43F5E;       /* Brand Primary Color */
  --cal-radius: 12px;          /* Corner radius for slots/cards */
  --cal-bg: #0a0a0a;           /* Outer page background */
  --cal-card-bg: #111111;      /* Booking card container */
  --cal-border: rgba(255,255,255,0.1);
  --cal-text: #ffffff;
  --cal-subtext: #9ca3af;
}`, 'vars')}
                className="text-[11px] text-accent-blue hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-accent-blue/10 border border-accent-blue/20 transition-colors"
              >
                {copiedSnippet === 'vars' ? <Check size={12} /> : <Copy size={12} />}
                {copiedSnippet === 'vars' ? 'Copied' : 'Copy Variables'}
              </button>
            </div>
            <p className="text-[11px] text-text-tertiary">
              Override these variables in your parent website or iframe stylesheet to instantly rebrand the entire booking widget:
            </p>
            <pre className="p-3 bg-black/60 border border-white/10 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`:root {
  --cal-accent: #F43F5E;       /* Brand Primary Color */
  --cal-radius: 12px;          /* Corner radius for slots/cards */
  --cal-bg: #0a0a0a;           /* Outer page background */
  --cal-card-bg: #111111;      /* Booking card container */
  --cal-border: rgba(255,255,255,0.1);
  --cal-text: #ffffff;
  --cal-subtext: #9ca3af;
}`}
            </pre>
          </div>

          {/* Section 2: Class Selectors */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Layers size={14} className="text-accent-blue" />
              2. Targetable Component Classes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-container</code>
                <p className="text-text-tertiary mt-0.5">Main booking widget wrapper box</p>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-sidebar</code>
                <p className="text-text-tertiary mt-0.5">Left host details & logo card</p>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-title</code>
                <p className="text-text-tertiary mt-0.5">Public calendar event title header</p>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-date-btn</code>
                <p className="text-text-tertiary mt-0.5">Calendar date picker day numbers</p>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-date-selected</code>
                <p className="text-text-tertiary mt-0.5">Currently active chosen date cell</p>
              </div>
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg">
                <code className="text-accent-blue font-bold">.cal-slot-btn</code>
                <p className="text-text-tertiary mt-0.5">Available meeting time buttons</p>
              </div>
            </div>
          </div>

          {/* Section 3: Embed Preset Snippets */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent-blue" />
              3. Ready-To-Paste Embed Styling Presets
            </h4>

            {/* Glassmorphic Dark */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">✨ Glassmorphism & Translucent Glow</span>
                <button
                  onClick={() => copyCode(`/* Glassmorphic Embed Iframe Styling */
.cal-embed-wrapper {
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}`, 'glass')}
                  className="text-[11px] text-accent-blue hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedSnippet === 'glass' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSnippet === 'glass' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-2.5 bg-black/60 rounded font-mono text-[10px] text-zinc-300 overflow-x-auto">
{`.cal-embed-wrapper {
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}`}
              </pre>
            </div>

            {/* Custom Typography */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs">🔤 Brand Typography Matching</span>
                <button
                  onClick={() => copyCode(`/* Custom Brand Font Integration */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');

.cal-wrapper, .cal-container {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}`, 'font')}
                  className="text-[11px] text-accent-blue hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedSnippet === 'font' ? <Check size={12} /> : <Copy size={12} />}
                  {copiedSnippet === 'font' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-2.5 bg-black/60 rounded font-mono text-[10px] text-zinc-300 overflow-x-auto">
{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
.cal-wrapper, .cal-container {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs transition-colors"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareEmbedModal({ calendarId, onClose }) {
  const [showCssGuide, setShowCssGuide] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/book/${calendarId}` : `/book/${calendarId}`;
  const embedCode = `<iframe \n  src="${url}?embed=true" \n  width="100%" \n  height="700px" \n  frameborder="0" \n  style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);"\n></iframe>`;

  const copyToClipboard = (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <>
      {showCssGuide && <CssGuideModal onClose={() => setShowCssGuide(false)} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
        <div className="bg-[#111] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-xl w-full h-[100dvh] sm:h-auto sm:max-w-lg shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-accent-blue" /> Share Calendar
            </h3>
            <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-white rounded-md hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Direct Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={url} 
                  className="flex-1 bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none" 
                />
                <button 
                  onClick={() => copyToClipboard(url)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-1.5">Share this link directly via email or social media.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Embed Code (Responsive iframe)</label>
                <button
                  type="button"
                  onClick={() => setShowCssGuide(true)}
                  className="text-xs text-accent-blue hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/30 transition-colors font-medium cursor-pointer"
                >
                  <Code2 size={13} />
                  CSS Guide
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  readOnly 
                  value={embedCode} 
                  rows={8}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-text-tertiary font-mono focus:outline-none resize-none" 
                />
                <button 
                  onClick={() => copyToClipboard(embedCode)}
                  className="absolute top-2 right-2 p-2 bg-[#222]/80 backdrop-blur border border-white/10 rounded-md text-white transition-colors hover:bg-white/10"
                  title="Copy embed code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-1.5">Paste this into Webflow, WordPress, or any HTML builder. It adapts perfectly to mobile devices.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CalendarManager({ initialCalendars }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [calendars, setCalendars] = useState(initialCalendars || []);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [shareModalCalendarId, setShareModalCalendarId] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSmartOptimizerModal, setShowSmartOptimizerModal] = useState(false);
  const [calendarToDelete, setCalendarToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  React.useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && !isEditing) {
      const cal = calendars.find(c => c.id === editId);
      if (cal) {
        setEditingCalendar(cal);
        setIsEditing(true);
      }
    }
  }, [searchParams, calendars, isEditing]);

  // Debounced auto-save
  React.useEffect(() => {
    if (!isEditing || !editingCalendar) return;
    if (!editingCalendar.name) return; // Name is required

    const timer = setTimeout(async () => {
      setSaveStatus('Saving...');
      try {
        if (editingCalendar.id) {
          const updated = await updateCalendar(editingCalendar.id, editingCalendar);
          setCalendars(prev => prev.map(c => c.id === updated.id ? updated : c));
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try { new BroadcastChannel('automatix_calendars').postMessage('updated'); } catch {}
          }
        } else {
          const created = await createCalendar(editingCalendar);
          setEditingCalendar(prev => ({ ...prev, id: created.id }));
          setCalendars(prev => [created, ...prev]);
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try { new BroadcastChannel('automatix_calendars').postMessage('updated'); } catch {}
          }
          router.push(`${pathname}?edit=${created.id}`, { scroll: false });
        }
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus(err.message || 'Error saving');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editingCalendar, isEditing]);

  const handleAddNew = () => {
    setEditingCalendar({
      name: '',
      description: '',
      slug: '',
      themeColor: '#3B82F6',
      buttonStyle: 'rounded',
      fontFamily: 'Plus Jakarta Sans',
      bgTheme: 'obsidian',
      customBgColor: '#0a0a0a',
      customCardColor: '#111111',
      customTextColor: '#ffffff',
      duration: 30,
      bufferBefore: 0,
      bufferAfter: 0,
      futureLimit: 30,
      dateRangeType: 'days_in_future',
      futureLimitType: 'calendar_days',
      dateRangeStart: null,
      dateRangeEnd: null,
      noticePeriod: 4,
      noticePeriodUnit: 'hours',
      slotIncrement: 30,
      maxBookingsPerDay: null,
      timezone: 'UTC',
      meetUrl: '',
      sendDefaultEmail: true,
      emailTemplate: null,
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [],
        sunday: []
      },
      questions: [],
      isActive: true,
    });
    setIsEditing(true);
    router.push(`${pathname}?new=true`, { scroll: false });
  };

  const promptDeleteCalendar = (id) => {
    setCalendarToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!calendarToDelete) return;
    const targetId = calendarToDelete;
    setIsDeleteModalOpen(false);
    
    try {
      await deleteCalendar(targetId);
      setCalendars(calendars.filter(c => c.id !== targetId));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try { new BroadcastChannel('automatix_calendars').postMessage('updated'); } catch {}
      }
      toast.success('Calendar deleted successfully');
    } catch (err) {
      toast.error('Failed to delete calendar');
    } finally {
      setCalendarToDelete(null);
    }
  };

  if (isEditing) {
    return (
      <>
        {shareModalCalendarId && (
          <ShareEmbedModal calendarId={shareModalCalendarId} onClose={() => setShareModalCalendarId(null)} />
        )}
        {showAvailabilityModal && (
          <AvailabilityModal 
            calendar={editingCalendar}
            onChange={setEditingCalendar}
            onClose={() => setShowAvailabilityModal(false)}
          />
        )}
        <div className="bg-[#111] border-y sm:border border-border-subtle rounded-none sm:rounded-xl -mx-4 sm:mx-0 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32 md:pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue/20 to-purple-500/20 border border-accent-blue/30 flex items-center justify-center shrink-0 shadow-lg shadow-accent-blue/10">
                <CalendarIcon className="w-5 h-5 text-accent-blue" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-white">
                {editingCalendar.id ? 'Edit Calendar' : 'Create Calendar'}
              </h2>
            </div>
            {saveStatus && (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${saveStatus === 'Saved' ? 'bg-green-500/10 text-green-400' : saveStatus === 'Saving...' ? 'bg-white/5 text-text-tertiary' : 'bg-red-500/10 text-red-400'}`}>
                {saveStatus}
              </span>
            )}
          </div>
          <div className="hidden md:flex flex-wrap gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0 justify-start md:justify-end">
            {editingCalendar.id && (
              <>
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-accent-blue border border-accent-blue/30 bg-accent-blue/5 hover:bg-accent-blue/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-4 h-4" /> Availability
                </button>
                <a
                  href={`/book/${editingCalendar.id}`}
                  target="_blank"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Preview
                </a>
                <button
                  onClick={() => setShareModalCalendarId(editingCalendar.id)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </>
            )}
            <button
              onClick={() => {
                setIsEditing(false);
                router.push(pathname, { scroll: false });
              }}
              className="px-6 py-2 rounded-md text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              Done
            </button>
          </div>
        </div>

        {/* Mobile Fixed Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#111]/95 backdrop-blur-md border-t border-white/10 z-40 flex flex-wrap gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {editingCalendar.id && (
            <>
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="px-3 py-3 rounded-lg text-sm font-medium text-accent-blue border border-accent-blue/30 bg-accent-blue/5 hover:bg-accent-blue/10 transition-colors flex items-center justify-center gap-1.5 flex-[1.5] min-w-[120px]"
              >
                <Clock className="w-4 h-4 shrink-0" /> Availability
              </button>
              <a
                href={`/book/${editingCalendar.id}`}
                target="_blank"
                className="px-3 py-3 rounded-lg text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 flex-1 min-w-[80px]"
              >
                <ExternalLink className="w-4 h-4 shrink-0" /> Preview
              </a>
              <button
                onClick={() => setShareModalCalendarId(editingCalendar.id)}
                className="px-3 py-3 rounded-lg text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 flex-1 min-w-[80px]"
              >
                <Share2 className="w-4 h-4 shrink-0" /> Share
              </button>
            </>
          )}
          <button
            onClick={() => {
              setIsEditing(false);
              router.push(pathname, { scroll: false });
            }}
            className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-accent-blue border border-accent-blue/50 hover:bg-accent-blue/90 transition-colors flex items-center justify-center flex-1 min-w-[80px]"
          >
            Done
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Basic Details</h3>
              
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Public Event Name (e.g., 30 Min Discovery Call)</label>
                <input 
                  type="text" 
                  value={editingCalendar.name}
                  onChange={e => setEditingCalendar({...editingCalendar, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Internal Reference Name (Optional)</label>
                <input 
                  type="text" 
                  value={editingCalendar.internalName || ''}
                  onChange={e => setEditingCalendar({...editingCalendar, internalName: e.target.value})}
                  placeholder="e.g., Sales Team Discovery"
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Host Timezone</label>
                <Select 
                  value={editingCalendar.timezone || 'UTC'}
                  onChange={val => setEditingCalendar({...editingCalendar, timezone: val})}
                  options={[
                    { value: 'America/New_York', label: 'Eastern Time (ET)' },
                    { value: 'America/Chicago', label: 'Central Time (CT)' },
                    { value: 'America/Denver', label: 'Mountain Time (MT)' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                    { value: 'Europe/London', label: 'London (GMT/BST)' },
                    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
                    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
                    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
                    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
                    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                  ]}
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-text-secondary mb-2">Event Description & Instructions</label>
                <RichTextEditor 
                  value={editingCalendar.description || ''}
                  onChange={val => setEditingCalendar({...editingCalendar, description: val})}
                />
              </div>
            </div>

            <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Custom Invitee Questions</h3>
              <QuestionBuilder 
                questions={editingCalendar.questions || []}
                onChange={val => setEditingCalendar({...editingCalendar, questions: val})}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-b from-accent-blue/10 to-transparent p-5 rounded-lg border border-accent-blue/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-blue" />
                  <h3 className="text-sm font-semibold text-white">Premium UI Customization</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmartOptimizerModal(true)}
                  className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all shadow-sm cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  AI Radahn Brand Optimizer
                </button>
              </div>

              {/* 1. Google Typography Font Selector */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-purple-400" /> Google Typography / Font
                </label>
                <Select 
                  value={editingCalendar.fontFamily || 'Plus Jakarta Sans'}
                  onChange={val => setEditingCalendar({...editingCalendar, fontFamily: val})}
                  options={GOOGLE_FONTS_CATALOG.map(f => ({
                    value: f.name,
                    label: `${f.name} — ${f.category}`
                  }))}
                />
              </div>

              {/* 2. Calendar Background Tone & Palette */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" /> Calendar Background & Theme Tone
                </label>
                <Select 
                  value={editingCalendar.bgTheme || 'obsidian'}
                  onChange={val => setEditingCalendar({...editingCalendar, bgTheme: val})}
                  options={CALENDAR_THEMES.map(t => ({
                    value: t.id,
                    label: t.name
                  }))}
                />

                {/* Custom Palette Color Pickers if 'custom' is selected */}
                {editingCalendar.bgTheme === 'custom' && (
                  <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Custom Palette Overrides</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-text-tertiary block mb-1">Page Background</label>
                        <ColorPicker 
                          value={editingCalendar.customBgColor || '#0a0a0a'}
                          onChange={val => setEditingCalendar({...editingCalendar, customBgColor: val})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-tertiary block mb-1">Card Container</label>
                        <ColorPicker 
                          value={editingCalendar.customCardColor || '#111111'}
                          onChange={val => setEditingCalendar({...editingCalendar, customCardColor: val})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-tertiary block mb-1">Text Color</label>
                        <ColorPicker 
                          value={editingCalendar.customTextColor || '#ffffff'}
                          onChange={val => setEditingCalendar({...editingCalendar, customTextColor: val})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 3. Theme Accent Color with Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Theme Accent Color</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { hex: '#F43F5E', name: 'Rose' },
                    { hex: '#3B82F6', name: 'Blue' },
                    { hex: '#8B5CF6', name: 'Violet' },
                    { hex: '#10B981', name: 'Emerald' },
                    { hex: '#F59E0B', name: 'Amber' },
                    { hex: '#06B6D4', name: 'Cyan' },
                    { hex: '#EC4899', name: 'Pink' },
                    { hex: '#FFFFFF', name: 'White' },
                  ].map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setEditingCalendar({...editingCalendar, themeColor: preset.hex})}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center border ${
                        editingCalendar.themeColor?.toLowerCase() === preset.hex.toLowerCase()
                          ? 'scale-115 border-white ring-2 ring-white/30 shadow-lg' 
                          : 'border-white/20 hover:scale-110'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {editingCalendar.themeColor?.toLowerCase() === preset.hex.toLowerCase() && (
                        <div className={`w-2 h-2 rounded-full ${preset.hex === '#FFFFFF' ? 'bg-black' : 'bg-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
                <ColorPicker 
                  value={editingCalendar.themeColor}
                  onChange={val => setEditingCalendar({...editingCalendar, themeColor: val})}
                />
              </div>

              {/* 4. Button & Time Slot Style */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Button & Time Slot Shape</label>
                <Select 
                  value={editingCalendar.buttonStyle || 'rounded'}
                  onChange={val => setEditingCalendar({...editingCalendar, buttonStyle: val})}
                  options={[
                    { value: 'rounded', label: 'Rounded Corners (Modern)' },
                    { value: 'sharp', label: 'Sharp Edges (Minimalist)' },
                    { value: 'pill', label: 'Fully Rounded (Pill)' }
                  ]}
                />
              </div>

              {/* 5. Company Logo URL */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Company Logo URL (Optional)</label>
                <input 
                  type="url" 
                  value={editingCalendar.logoUrl || ''}
                  onChange={e => setEditingCalendar({...editingCalendar, logoUrl: e.target.value})}
                  placeholder="https://your-website.com/logo.png"
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" 
                />
                {editingCalendar.logoUrl && (
                  <div className="mt-2 p-2 bg-black/30 border border-white/10 rounded-md flex items-center justify-center">
                    <img src={editingCalendar.logoUrl} alt="Logo Preview" className="max-h-12 object-contain" onError={(e) => e.target.style.display='none'} />
                  </div>
                )}
              </div>

              {/* 6. Live Visual Preview Box with Theme & Font reflection */}
              {(() => {
                const resolved = getResolvedTheme(editingCalendar);
                const activeFont = editingCalendar.fontFamily || 'Plus Jakarta Sans';
                return (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Live Visual Preview</label>
                      <span className="text-[10px] text-text-tertiary font-mono">{activeFont}</span>
                    </div>
                    <div 
                      className="p-4 border rounded-xl space-y-3 relative overflow-hidden transition-all shadow-md"
                      style={{ 
                        backgroundColor: resolved.card || '#111111',
                        borderColor: resolved.border || 'rgba(255,255,255,0.1)',
                        color: resolved.text || '#ffffff',
                        fontFamily: `${activeFont}, sans-serif`
                      }}
                    >
                      <div 
                        className="absolute top-0 left-0 right-0 h-1.5" 
                        style={{ background: editingCalendar.themeColor || '#3B82F6' }}
                      />
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold truncate max-w-[140px]" style={{ color: resolved.text || '#ffffff' }}>
                          {editingCalendar.name || 'Sample Meeting'}
                        </span>
                        <span 
                          className="px-2.5 py-0.5 text-[10px] font-bold shadow-sm"
                          style={{ 
                            background: editingCalendar.themeColor || '#3B82F6',
                            color: getContrastColor(editingCalendar.themeColor || '#3B82F6'),
                            borderRadius: editingCalendar.buttonStyle === 'sharp' ? '2px' : editingCalendar.buttonStyle === 'pill' ? '9999px' : '6px'
                          }}
                        >
                          Aug 28
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        {(() => {
                          const themeContrast = getContrastColor(editingCalendar.themeColor || '#3B82F6');
                          const bgContrast = getContrastColor(resolved.card || resolved.bg || '#ffffff');
                          const safeTextColor = themeContrast === bgContrast ? bgContrast : (editingCalendar.themeColor || '#3B82F6');
                          return (
                            <div 
                              className="py-1.5 px-2 border font-medium transition-all"
                              style={{ 
                                borderColor: `${safeTextColor}55`,
                                color: safeTextColor,
                                backgroundColor: `${safeTextColor}15`,
                                borderRadius: editingCalendar.buttonStyle === 'sharp' ? '2px' : editingCalendar.buttonStyle === 'pill' ? '9999px' : '6px'
                              }}
                            >
                              9:00 AM
                            </div>
                          );
                        })()}
                        <div 
                          className="py-1.5 px-2 border font-medium shadow-sm"
                          style={{ 
                            borderColor: editingCalendar.themeColor || '#3B82F6',
                            background: editingCalendar.themeColor || '#3B82F6',
                            color: getContrastColor(editingCalendar.themeColor || '#3B82F6'),
                            borderRadius: editingCalendar.buttonStyle === 'sharp' ? '2px' : editingCalendar.buttonStyle === 'pill' ? '9999px' : '6px'
                          }}
                        >
                          10:00 AM
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Checkbox 
                    checked={editingCalendar.sendDefaultEmail !== false}
                    onChange={checked => setEditingCalendar({...editingCalendar, sendDefaultEmail: checked})}
                    label="Send Default Confirmation Email (Themed)"
                  />
                  {editingCalendar.sendDefaultEmail !== false && (
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="text-xs font-semibold text-accent-blue hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Preview Template</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-text-tertiary ml-6">
                  Rich responsive HTML email • Mobile & dark mode ready.
                </p>
              </div>
            </div>

            <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Location & Confirmation</h3>
              
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Location / Platform</label>
                <Select 
                  value={editingCalendar.platform}
                  onChange={val => setEditingCalendar({...editingCalendar, platform: val})}
                  options={[
                    { value: 'gmeet', label: 'Google Meet (Static Dedicated Link)' },
                    { value: 'zoom', label: 'Zoom (Static Dedicated Link)' },
                    { value: 'phone', label: 'Phone Call (Invitee provides number)' }
                  ]}
                />
              </div>

              {(editingCalendar.platform === 'gmeet' || editingCalendar.platform === 'zoom') && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-500 mb-1">Prevent Meeting Crashers</h4>
                      <p className="text-xs text-yellow-500/80 mb-3">
                        Using a static link means anyone with the link can join. <strong>You MUST turn off "Quick Access" in your Google Meet Host Controls.</strong> This forces attendees into a waiting room, preventing them from interrupting your previous calls.
                      </p>
                      <label className="block text-xs font-medium text-yellow-500/90 mb-1">Static Meeting URL</label>
                      <input 
                        type="url" 
                        value={editingCalendar.meetUrl || ''}
                        onChange={e => setEditingCalendar({...editingCalendar, meetUrl: e.target.value})}
                        placeholder="https://meet.google.com/abc-defg-hij"
                        className="w-full bg-black/30 border border-yellow-500/20 rounded-md px-3 py-2 text-sm text-yellow-100 placeholder:text-yellow-500/30 focus:outline-none focus:border-yellow-500/50" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Success Redirection URL (Optional)</label>
                <input 
                  type="url" 
                  value={editingCalendar.redirectUrl || ''}
                  onChange={e => setEditingCalendar({...editingCalendar, redirectUrl: e.target.value})}
                  placeholder="https://your-website.com/thank-you"
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEmailModal && editingCalendar && (
        <EmailTemplateModal
          calendar={editingCalendar}
          emailTemplate={editingCalendar.emailTemplate}
          onChange={(tpl) => setEditingCalendar(prev => ({ ...prev, emailTemplate: tpl }))}
          onClose={() => setShowEmailModal(false)}
        />
      )}
      {showSmartOptimizerModal && editingCalendar && (
        <SmartBrandOptimizerModal
          calendar={editingCalendar}
          onApply={(opt) => setEditingCalendar(prev => ({
            ...prev,
            themeColor: opt.themeColor || prev.themeColor,
            bgTheme: opt.bgTheme || prev.bgTheme,
            fontFamily: opt.fontFamily || prev.fontFamily,
            buttonStyle: opt.buttonStyle || prev.buttonStyle,
          }))}
          onClose={() => setShowSmartOptimizerModal(false)}
        />
      )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {shareModalCalendarId && (
        <ShareEmbedModal calendarId={shareModalCalendarId} onClose={() => setShareModalCalendarId(null)} />
      )}
      {showAvailabilityModal && (
        <AvailabilityModal 
          calendar={editingCalendar}
          onChange={setEditingCalendar}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#111] p-6 rounded-xl border border-border-subtle">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Calendar Events</h2>
          <p className="text-xs text-text-secondary mt-1">Manage your events and link them to automated workflows.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Calendar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendars.map(calendar => (
          <div key={calendar.id} className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden hover:border-white/20 transition-all flex flex-col group">
            <div className="h-2 w-full" style={{ backgroundColor: calendar.themeColor || '#3B82F6' }} />
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-semibold text-white truncate pr-2">{calendar.name}</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-text-secondary shrink-0">
                  {calendar.platform}
                </span>
              </div>
              {calendar.internalName && (
                <p className="text-xs text-text-secondary mb-3">Internal: {calendar.internalName}</p>
              )}
              <p className="text-xs text-text-tertiary line-clamp-2 mb-4 flex-1">
                {calendar.description ? calendar.description.replace(new RegExp('<[^>]+>', 'g'), '') : 'No description provided.'}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[10px] bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-text-secondary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-accent-blue" />
                  {(calendar.questions || []).length} Custom Questions
                </span>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-between items-center mt-auto">
                <div className="flex gap-3">
                  <a 
                    href={`/book/${calendar.id}`} 
                    target="_blank"
                    className="text-xs text-accent-blue hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Public Page
                  </a>
                  <button 
                    onClick={() => setShareModalCalendarId(calendar.id)}
                    className="text-xs text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <a 
                    href={`/dashboard/calendars/${calendar.id}/bookings`}
                    className="text-xs text-text-secondary hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" /> Bookings
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingCalendar(calendar);
                      setIsEditing(true);
                      router.push(`${pathname}?edit=${calendar.id}`, { scroll: false });
                    }}
                    className="p-1.5 text-text-secondary hover:text-white rounded-md hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => promptDeleteCalendar(calendar.id)}
                    className="p-1.5 text-text-secondary hover:text-red-400 rounded-md hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {calendars.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-border-subtle rounded-xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No calendars yet</h3>
            <p className="text-sm text-text-secondary max-w-md text-center mb-6">
              Create your first Premium Calendar to start accepting bookings with custom logic and automated follow-ups.
            </p>
            <button
              onClick={handleAddNew}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create First Calendar
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCalendarToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Calendar"
        message="Are you sure you want to permanently delete this calendar? All booking configurations and public booking links for this calendar will be removed."
        confirmText="Delete Calendar"
        isDestructive={true}
      />

    </div>
  );
}
