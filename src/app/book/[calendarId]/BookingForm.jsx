'use client';

import { useState, useEffect, useRef } from 'react';
import { createBooking } from '@/actions/bookings';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Loader2, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';
import dayjs from 'dayjs';
import { COUNTRIES } from '@/utils/countries';
import { getResolvedTheme, getContrastColor } from '@/utils/calendarThemes';

const countryOptions = COUNTRIES.map(c => ({
  value: `${c.code} ${c.dial}`,
  label: `${c.code} ${c.dial}`,
  searchLabel: `${c.name} ${c.code} ${c.dial}`,
  icon: <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} width="16" alt={c.code} className="rounded-sm shadow-[0_0_2px_rgba(0,0,0,0.5)] object-cover" />
}));

export default function BookingForm({ calendar, questions, selectedSlot, localTimezone, resolvedTheme }) {
  const themeObj = resolvedTheme || getResolvedTheme(calendar);
  const searchParams = useSearchParams();
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Basic Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Custom Questions State
  const [answers, setAnswers] = useState({});
  const [hiddenParams, setHiddenParams] = useState({});
  const [errors, setErrors] = useState({});

  const clearError = (fieldKey) => {
    setErrors(prev => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  // Auto-capture hidden URL parameters on mount
  useEffect(() => {
    const hidden = {};
    questions.forEach(q => {
      if (q.isHidden && q.urlParamMap) {
        const valFromUrl = searchParams.get(q.urlParamMap);
        if (valFromUrl) {
          hidden[q.urlParamMap] = valFromUrl;
        }
      }
    });
    setHiddenParams(hidden);
  }, [questions, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate custom questions
    for (const q of questions) {
      if (q.required && !q.isHidden && evaluateVisibility(q)) {
        const val = answers[q.label];
        if (q.type === 'checkbox') {
          if (!val || !Array.isArray(val) || val.length === 0) {
            newErrors[q.label] = 'Please select at least one option';
          }
        } else if (q.type === 'phone') {
          if (!val || typeof val !== 'string') {
            newErrors[q.label] = 'Please enter your phone number';
          } else {
            // value is formatted as "IN +91 9876543210" or similar
            const parts = val.split(' ');
            const numPart = parts.slice(2).join('').trim();
            if (!numPart) {
              newErrors[q.label] = 'Please enter your phone number';
            } else if (numPart.length < 5) {
              newErrors[q.label] = 'Please enter a valid phone number';
            }
          }
        } else if (q.type === 'dropdown' || q.type === 'radio') {
          if (!val || String(val).trim() === '') {
            newErrors[q.label] = 'Please select an option';
          }
        } else {
          if (!val || String(val).trim() === '') {
            newErrors[q.label] = 'This field is required';
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please complete all required fields');
      if (formRef.current) {
        const firstErrorEl = formRef.current.querySelector('.\\!border-rose-500\\/80, .border-rose-500\\/40, [style*="border-color: rgb(244, 63, 94)"]');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await createBooking({
        calendarId: calendar.id,
        name: name.trim(),
        email: email.trim(),
        startTime: new Date(selectedSlot).toISOString(),
        timezone: localTimezone,
        answers: { ...answers, ...hiddenParams },
      });

      setIsSuccess(true);
      
      if (calendar.redirectUrl) {
        setTimeout(() => {
          window.location.href = calendar.redirectUrl;
        }, 2000);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const evaluateVisibility = (q) => {
    if (!q.visibilityRule) return true;
    const { dependsOnId, operator, value } = q.visibilityRule;
    if (!dependsOnId) return true;

    const dependsOnQ = questions.find(question => question.id === dependsOnId);
    if (!dependsOnQ) return true;

    const actualAnswer = answers[dependsOnQ.label];
    const answerStr = actualAnswer == null ? '' : Array.isArray(actualAnswer) ? actualAnswer.join(',') : String(actualAnswer);
    const targetVal = String(value);

    switch (operator) {
      case 'equals':
        if (Array.isArray(actualAnswer)) return actualAnswer.includes(targetVal);
        return answerStr.toLowerCase() === targetVal.toLowerCase();
      case 'not_equals':
        if (Array.isArray(actualAnswer)) return !actualAnswer.includes(targetVal);
        return answerStr.toLowerCase() !== targetVal.toLowerCase();
      case 'contains':
        return answerStr.toLowerCase().includes(targetVal.toLowerCase());
      case 'greater_than':
        return Number(answerStr) > Number(targetVal);
      case 'less_than':
        return Number(answerStr) < Number(targetVal);
      case 'between':
        const [min, max] = targetVal.split(',').map(n => Number(n.trim()));
        const num = Number(answerStr);
        return num >= min && num <= max;
      default:
        return true;
    }
  };

  const inputBg = themeObj.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)';
  const inputBorder = themeObj.border || 'rgba(255,255,255,0.1)';
  const inputColor = themeObj.text || '#ffffff';

  const renderQuestionInput = (q) => {
    if (q.isHidden) return null;

    const value = answers[q.label] || '';
    const hasError = !!errors[q.label];
    const onChange = (e) => {
      setAnswers(prev => ({ ...prev, [q.label]: e.target.value }));
      clearError(q.label);
    };
    const baseInputClass = `w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${
      hasError ? '!border-rose-500/80 !ring-1 !ring-rose-500/30' : 'focus:ring-accent-blue'
    }`;

    let inputNode = null;

    switch (q.type) {
      case 'text':
        inputNode = (
          <input 
            type="text" 
            value={value} 
            onChange={onChange} 
            placeholder={q.placeholder || ''}
            className={baseInputClass} 
            style={{ 
              backgroundColor: inputBg, 
              borderColor: hasError ? '#f43f5e' : inputBorder, 
              color: inputColor 
            }}
          />
        );
        break;
      case 'textarea':
        inputNode = (
          <textarea 
            rows={3} 
            value={value} 
            onChange={onChange} 
            placeholder={q.placeholder || ''}
            className={`${baseInputClass} resize-none`} 
            style={{ 
              backgroundColor: inputBg, 
              borderColor: hasError ? '#f43f5e' : inputBorder, 
              color: inputColor 
            }}
          />
        );
        break;
      case 'phone':
        let currentCode = 'IN +91';
        let currentNum = '';
        
        if (value) {
          const parts = value.split(' ');
          if (parts.length >= 2 && /^[A-Z]{2}$/.test(parts[0]) && parts[1].startsWith('+')) {
            currentCode = `${parts[0]} ${parts[1]}`;
            currentNum = parts.slice(2).join(' ');
          } else if (parts.length >= 1 && parts[0].startsWith('+')) {
            const matched = COUNTRIES.find(c => c.dial === parts[0]);
            if (matched) currentCode = `${matched.code} ${matched.dial}`;
            currentNum = parts.slice(1).join(' ');
          } else {
            currentNum = value;
          }
        }
        inputNode = (
          <div className="flex gap-2">
            <div className="w-36 shrink-0">
                <Select 
                  value={currentCode}
                  onChange={(val) => {
                    setAnswers(prev => ({ ...prev, [q.label]: `${val} ${currentNum}`.trim() }));
                    clearError(q.label);
                  }}
                  options={countryOptions}
                  buttonClassName={`py-2.5 ${hasError ? '!border-rose-500/80' : ''}`}
                />
            </div>
            <input 
              type="tel" 
              value={currentNum} 
              onChange={(e) => {
                setAnswers(prev => ({ ...prev, [q.label]: `${currentCode} ${e.target.value}`.trim() }));
                clearError(q.label);
              }}
              placeholder="98765 43210"
              className={`${baseInputClass} flex-1`} 
              style={{ 
                backgroundColor: inputBg, 
                borderColor: hasError ? '#f43f5e' : inputBorder, 
                color: inputColor 
              }}
            />
          </div>
        );
        break;
      case 'dropdown':
        inputNode = (
          <Select 
            value={value}
            onChange={(val) => {
              setAnswers(prev => ({ ...prev, [q.label]: val }));
              clearError(q.label);
            }}
            options={(q.options || []).map(opt => ({ value: opt, label: opt }))}
            placeholder="Select an option..."
            buttonClassName={`py-2.5 ${hasError ? '!border-rose-500/80 !ring-1 !ring-rose-500/30' : ''}`}
          />
        );
        break;
      case 'radio':
        inputNode = (
          <div className={`space-y-2 mt-1 p-2 rounded-lg transition-all ${hasError ? 'bg-rose-500/5 border border-rose-500/30' : ''}`}>
            {(q.options || []).map((opt, i) => (
              <Radio 
                key={i}
                name={`radio-${q.label}`} 
                value={opt} 
                checked={value === opt} 
                onChange={(val) => {
                  setAnswers(prev => ({ ...prev, [q.label]: val }));
                  clearError(q.label);
                }} 
                label={opt}
              />
            ))}
          </div>
        );
        break;
      case 'checkbox':
        inputNode = (
          <div className={`space-y-2 mt-1 p-2 rounded-lg transition-all ${hasError ? 'bg-rose-500/5 border border-rose-500/30' : ''}`}>
            {(q.options || []).map((opt, i) => {
              const currentArr = Array.isArray(value) ? value : [];
              const isChecked = currentArr.includes(opt);
              
              const handleCheck = () => {
                let newArr = [...currentArr];
                if (isChecked) newArr = newArr.filter(item => item !== opt);
                else newArr.push(opt);
                setAnswers(prev => ({ ...prev, [q.label]: newArr }));
                clearError(q.label);
              };

              return (
                <Checkbox 
                  key={i}
                  checked={isChecked} 
                  onChange={handleCheck} 
                  label={opt}
                />
              );
            })}
          </div>
        );
        break;
      default:
        inputNode = null;
    }

    return (
      <div>
        {inputNode}
        {hasError && (
          <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors[q.label]}
          </p>
        )}
      </div>
    );
  };

  if (isSuccess) {
    const formattedDate = dayjs(selectedSlot).format('dddd, MMMM D, YYYY');
    const formattedTime = dayjs(selectedSlot).format('h:mm A');

    return (
      <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeObj.text || '#ffffff' }}>You're Scheduled!</h2>
        <p className="text-sm max-w-sm mb-8" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
          A calendar invitation and confirmation email has been sent to <span className="font-semibold" style={{ color: themeObj.text || '#ffffff' }}>{email}</span>.
        </p>
        
        <div 
          className="border rounded-xl p-6 mb-8 w-full max-w-md text-left"
          style={{
            backgroundColor: themeObj.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
            borderColor: themeObj.border || 'rgba(255,255,255,0.1)'
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeObj.text || '#ffffff' }}>{calendar.name}</h3>
          
          <div className="space-y-3 mb-6" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-4 h-4 text-accent-blue" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent-blue" />
              <span>{formattedTime} ({localTimezone})</span>
            </div>
          </div>
          
          {calendar.meetUrl && (
            <div className="pt-4 border-t" style={{ borderColor: themeObj.border || 'rgba(255,255,255,0.1)' }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: themeObj.text || '#ffffff' }}>Meeting Link</h4>
              <div 
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  backgroundColor: themeObj.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)',
                  borderColor: themeObj.border || 'rgba(255,255,255,0.05)'
                }}
              >
                <div className="p-2 bg-accent-blue/20 rounded-md">
                  <CalendarIcon className="w-5 h-5 text-accent-blue" />
                </div>
                <a href={calendar.meetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue hover:underline break-all">
                  {calendar.meetUrl}
                </a>
              </div>
              <p className="text-[10px] mt-3 text-left" style={{ color: themeObj.textMuted || '#71717a' }}>
                Note: The host uses a waiting room for security. Please join a few minutes early and wait to be admitted.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const btnStyleClass = 
    calendar.buttonStyle === 'sharp' ? 'rounded-none' : 
    calendar.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-lg';

  return (
    <form onSubmit={handleSubmit} noValidate ref={formRef} className="space-y-8">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ color: themeObj.text || '#ffffff' }}>Enter Details</h2>
            <p className="text-sm" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>Please provide your information below.</p>
          </div>
        </div>

        {/* Selected Slot Summary */}
        <div 
          className="border rounded-xl p-4 flex items-center gap-4 mb-8"
          style={{
            backgroundColor: themeObj.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            borderColor: themeObj.border || 'rgba(255,255,255,0.1)'
          }}
        >
          <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: themeObj.text || '#ffffff' }}>
              {dayjs(selectedSlot).format('dddd, MMMM D, YYYY')}
            </p>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
              <Clock className="w-3 h-3" /> 
              {dayjs(selectedSlot).format('h:mm A')} - {dayjs(selectedSlot).add(calendar.duration || 30, 'minute').format('h:mm A')} ({localTimezone})
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
            Full Name *
          </label>
          <input 
            type="text" 
            value={name}
            onChange={e => {
              setName(e.target.value);
              clearError('name');
            }}
            placeholder="John Doe"
            className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${
              errors.name ? '!border-rose-500/80 !ring-1 !ring-rose-500/30' : 'focus:ring-accent-blue'
            }`}
            style={{ 
              backgroundColor: inputBg, 
              borderColor: errors.name ? '#f43f5e' : inputBorder, 
              color: inputColor 
            }}
          />
          {errors.name && (
            <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
            Email Address *
          </label>
          <input 
            type="email" 
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              clearError('email');
            }}
            placeholder="john@example.com"
            className={`w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${
              errors.email ? '!border-rose-500/80 !ring-1 !ring-rose-500/30' : 'focus:ring-accent-blue'
            }`}
            style={{ 
              backgroundColor: inputBg, 
              borderColor: errors.email ? '#f43f5e' : inputBorder, 
              color: inputColor 
            }}
          />
          {errors.email && (
            <p className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-400 font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        {questions.filter(q => !q.isHidden && evaluateVisibility(q)).map((q) => (
          <div key={q.id} className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
              {q.label} {q.required && '*'}
            </label>
            {renderQuestionInput(q)}
          </div>
        ))}
      </div>

      <div className="pt-6 mt-6 border-t" style={{ borderColor: themeObj.border || 'rgba(255,255,255,0.1)' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ 
            background: calendar.themeColor || '#3B82F6',
            color: getContrastColor(calendar.themeColor || '#3B82F6')
          }}
          className={`w-full py-3.5 px-4 font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 ${btnStyleClass}`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</>
          ) : 'Schedule Event'}
        </button>
      </div>
    </form>
  );
}
