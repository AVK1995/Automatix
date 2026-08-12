'use client';

import React, { useState, useEffect } from 'react';
import CalendarPicker from '@/components/booking/CalendarPicker';
import BookingForm from './BookingForm';
import { getAvailableSlots } from '@/actions/bookings';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function BookingWizard({ calendar, questions }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [localTimezone, setLocalTimezone] = useState('UTC');
  
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
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Time Selection
        </button>
        <BookingForm 
          calendar={calendar} 
          questions={questions} 
          selectedSlot={selectedSlot}
          localTimezone={localTimezone}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {step === 1 ? 'Select a Date' : 'Select a Time'}
          </h2>
          <p className="text-sm text-text-secondary">
            {step === 1 ? 'Choose an available day for your meeting.' : dayjs(selectedDate).format('dddd, MMMM D')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-text-secondary shrink-0">
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
            className="mb-4 flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Calendar
          </button>
          
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingSlots ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center text-text-tertiary">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">Finding availability...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-sm text-text-secondary">
                No available times on this date.
              </div>
            ) : (
              availableSlots.map(slot => {
                const formattedTime = dayjs(slot).tz(localTimezone).format('h:mm A');
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotSelect(slot)}
                    className="py-3 px-4 rounded-lg border border-accent-blue/30 text-accent-blue font-medium text-sm hover:bg-accent-blue hover:text-white transition-all text-center"
                  >
                    {formattedTime}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
