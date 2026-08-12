'use client';

import React from 'react';
import { Plus, Trash2, Clock, Copy, X } from 'lucide-react';
import Checkbox from '@/components/ui/Checkbox';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function WeeklyScheduleBuilder({ availability, onChange, onErrorStateChange }) {
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    const errs = {};
    Object.keys(availability).forEach(day => {
      const slots = availability[day] || [];
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].start >= slots[i].end) {
          errs[day] = "Start time must be before end time.";
          return;
        }
        for (let j = i + 1; j < slots.length; j++) {
          if (slots[i].start < slots[j].end && slots[i].end > slots[j].start) {
            errs[day] = "Time slots cannot overlap.";
            return;
          }
          if (slots[i].start === slots[j].start && slots[i].end === slots[j].end) {
            errs[day] = "Duplicate slots are not allowed.";
            return;
          }
        }
      }
    });
    setErrors(errs);
    if (onErrorStateChange) {
      onErrorStateChange(Object.keys(errs).length > 0);
    }
  }, [availability, onErrorStateChange]);

  const handleAddSlot = (day) => {
    const newAvail = { ...availability };
    if (!newAvail[day]) newAvail[day] = [];
    
    let newStart = '09:00';
    let newEnd = '17:00';
    const existing = newAvail[day];
    
    if (existing.length > 0) {
      const last = existing[existing.length - 1];
      newStart = last.end;
      const [h, m] = newStart.split(':').map(Number);
      let endH = h + 1;
      if (endH > 23) endH = 23;
      newEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (newStart >= newEnd) newEnd = '23:59';
    }
    
    newAvail[day].push({ start: newStart, end: newEnd });
    onChange(newAvail);
  };

  const handleRemoveSlot = (day, index) => {
    const newAvail = { ...availability };
    newAvail[day].splice(index, 1);
    onChange(newAvail);
  };

  const handleUpdateSlot = (day, index, field, value) => {
    const newAvail = { ...availability };
    newAvail[day][index][field] = value;
    onChange(newAvail);
  };

  const handleToggleDay = (day, enabled) => {
    const newAvail = { ...availability };
    if (enabled) {
      newAvail[day] = [{ start: '09:00', end: '17:00' }];
    } else {
      newAvail[day] = [];
    }
    onChange(newAvail);
  };

  const [copySourceDay, setCopySourceDay] = React.useState(null);
  const [copyTargetDays, setCopyTargetDays] = React.useState({});

  const handleOpenCopy = (day) => {
    setCopySourceDay(day);
    // Modal comes with nothing pre-selected
    const initialTargets = {};
    DAYS.forEach(d => {
      if (d !== day) {
        initialTargets[d] = false;
      }
    });
    setCopyTargetDays(initialTargets);
  };

  const handleApplyCopy = () => {
    if (!copySourceDay) return;
    const newAvail = { ...availability };
    const sourceSlots = [...(availability[copySourceDay] || [])];
    
    Object.entries(copyTargetDays).forEach(([day, isSelected]) => {
      if (isSelected) {
        // Deep copy the slots so they don't share references
        newAvail[day] = sourceSlots.map(slot => ({ ...slot }));
      }
    });
    
    onChange(newAvail);
    setCopySourceDay(null);
  };

  return (
    <div className="space-y-4">
      {DAYS.map(day => {
        const slots = availability?.[day] || [];
        const isEnabled = slots.length > 0;

        return (
          <div key={day} className="flex flex-col sm:flex-row items-start sm:gap-4 p-3 rounded-lg bg-black/30 border border-white/5">
            <div className="w-full sm:w-32 shrink-0 flex items-center mb-2 sm:mb-0 sm:pt-1.5">
              <Checkbox 
                checked={isEnabled}
                onChange={(checked) => handleToggleDay(day, checked)}
                label={<span className="capitalize">{day}</span>}
              />
            </div>

            <div className="flex-1 w-full space-y-2">
              {!isEnabled ? (
                <div className="text-sm text-text-tertiary pt-1.5">Unavailable</div>
              ) : (
                <>
                  {slots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="time" 
                        value={slot.start}
                        onChange={e => handleUpdateSlot(day, idx, 'start', e.target.value)}
                        className={`bg-black/50 border ${errors[day] ? 'border-red-500/50' : 'border-white/10'} rounded-md px-2 py-2 sm:py-1 text-sm text-white focus:outline-none focus:border-accent-blue`}
                      />
                      <span className="text-text-tertiary">-</span>
                      <input 
                        type="time" 
                        value={slot.end}
                        onChange={e => handleUpdateSlot(day, idx, 'end', e.target.value)}
                        className={`bg-black/50 border ${errors[day] ? 'border-red-500/50' : 'border-white/10'} rounded-md px-2 py-2 sm:py-1 text-sm text-white focus:outline-none focus:border-accent-blue`}
                      />
                      <button 
                        onClick={() => handleRemoveSlot(day, idx)}
                        className="p-2 sm:p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {errors[day] && (
                    <div className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-md mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                      {errors[day]}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="shrink-0 pt-1 flex items-center gap-1">
              <button 
                onClick={() => handleAddSlot(day)}
                className="p-2 sm:p-1.5 text-text-tertiary hover:text-white rounded-md hover:bg-white/5 transition-colors"
                title="Add hours"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleOpenCopy(day)}
                disabled={!isEnabled}
                className="p-1.5 text-text-secondary hover:text-white rounded-md hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Copy to..."
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Copy Modal */}
      {copySourceDay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-xl w-full h-[100dvh] sm:h-auto sm:max-w-md shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-accent-blue" /> Copy <span className="capitalize">{copySourceDay}</span>
              </h3>
              <button onClick={() => setCopySourceDay(null)} className="p-1.5 text-text-tertiary hover:text-white rounded-md hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 flex-1 overflow-y-auto">
              <p className="text-sm text-text-secondary mb-2">Apply these hours to:</p>
              {DAYS.filter(d => d !== copySourceDay).map(day => (
                <div key={day} className="flex items-center gap-3">
                  <Checkbox 
                    checked={copyTargetDays[day] || false}
                    onChange={(checked) => setCopyTargetDays(prev => ({ ...prev, [day]: checked }))}
                    label={<span className="capitalize text-sm">{day}</span>}
                  />
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#111]/90 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button 
                onClick={() => setCopySourceDay(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyCopy}
                className="px-4 py-2 text-sm font-medium text-white bg-accent-blue hover:bg-blue-600 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
