'use client';

import React, { useState, useEffect } from 'react';
import CalendarPicker from '@/components/booking/CalendarPicker';
import BookingForm from './BookingForm';
import { getAvailableSlots } from '@/actions/bookings';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getResolvedTheme, getContrastColor } from '@/utils/calendarThemes';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function BookingWizard({ calendar, questions, resolvedTheme }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [localTimezone, setLocalTimezone] = useState('UTC');
  const themeObj = resolvedTheme || getResolvedTheme(calendar);
  
  useEffect(() => {
    try {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      setLocalTimezone(calendar.timezone || 'UTC');
    }
  }, [calendar.timezone]);

  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr);
    setIsLoadingSlots(true);
    setStep(2);
    try {
      const slots = await getAvailableSlots(calendar.id, dateStr, localTimezone);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slotIso) => {
    setSelectedSlot(slotIso);
    setStep(3);
  };

  if (step === 3) {
    return (
      <div className="animate-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setStep(2)}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: themeObj.textSecondary || '#a1a1aa' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Time Selection
        </button>
        <BookingForm 
          calendar={calendar} 
          questions={questions} 
          selectedSlot={selectedSlot}
          localTimezone={localTimezone}
          resolvedTheme={themeObj}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: themeObj.text || '#ffffff' }}>
            {step === 1 ? 'Select a Date' : 'Select a Time'}
          </h2>
          <p className="text-sm" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
            {step === 1 ? 'Choose an available day for your meeting.' : dayjs(selectedDate).format('dddd, MMMM D')}
          </p>
        </div>
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium shrink-0"
          style={{ 
            color: themeObj.textSecondary || '#a1a1aa',
            backgroundColor: themeObj.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: themeObj.border || 'rgba(255,255,255,0.1)'
          }}
        >
          <Clock className="w-3 h-3" />
          <span className="max-w-[120px] truncate">{localTimezone}</span>
        </div>
      </div>

      {step === 1 && (
        <CalendarPicker 
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          calendar={calendar}
        />
      )}

      {step === 2 && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setStep(1)}
            className="mb-4 flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: themeObj.textSecondary || '#a1a1aa' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Calendar
          </button>
          
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingSlots ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center" style={{ color: themeObj.textMuted || '#71717a' }}>
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">Finding availability...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-sm" style={{ color: themeObj.textSecondary || '#a1a1aa' }}>
                No available times on this date.
              </div>
            ) : (
              availableSlots.map(slot => {
                const formattedTime = dayjs(slot).tz(localTimezone).format('h:mm A');
                const theme = calendar?.themeColor || '#3B82F6';
                const isSharp = calendar?.buttonStyle === 'sharp';
                const isPill = calendar?.buttonStyle === 'pill';
                const borderRadius = isSharp ? '2px' : isPill ? '9999px' : '10px';
                
                const themeContrast = getContrastColor(theme);
                const bgContrast = getContrastColor(themeObj.card || themeObj.bg || '#ffffff');
                const safeTextColor = themeContrast === bgContrast ? bgContrast : theme;

                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotSelect(slot)}
                    style={{
                      borderRadius,
                      borderColor: `${safeTextColor}40`,
                      color: safeTextColor,
                      backgroundColor: themeObj.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme;
                      e.currentTarget.style.color = getContrastColor(theme);
                      e.currentTarget.style.borderColor = theme;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = themeObj.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
                      e.currentTarget.style.color = safeTextColor;
                      e.currentTarget.style.borderColor = `${safeTextColor}40`;
                    }}
                    className="cal-slot-btn py-3 px-4 border font-semibold text-sm transition-all text-center shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {formattedTime}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
