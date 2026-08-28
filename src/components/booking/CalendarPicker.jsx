'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getResolvedTheme, getContrastColor } from '@/utils/calendarThemes';

export default function CalendarPicker({ selectedDate, onSelectDate, calendar }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  
  const today = dayjs().startOf('day');
  const minDate = today;
  const maxDate = today.add(calendar?.futureLimit || 30, 'day');

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDay = startOfMonth.day(); // 0 is Sunday
  const daysInMonth = currentMonth.daysInMonth();

  const calendarDays = [];
  // Previous month padding
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(startOfMonth.subtract(startDay - i, 'day'));
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(currentMonth.date(i));
  }
  // Next month padding to fill grid 35 or 42
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push(endOfMonth.add(i, 'day'));
  }

  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const hasHours = (dateObj) => {
    if (!calendar?.availability) return true;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[dateObj.day()];
    const slots = calendar.availability[dayName] || [];
    return slots.length > 0;
  };

  const resolvedTheme = getResolvedTheme(calendar);
  const theme = calendar?.themeColor || '#3B82F6';
  const isSharp = calendar?.buttonStyle === 'sharp';
  const radiusClass = isSharp ? 'rounded-sm' : 'rounded-full';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: resolvedTheme.text || '#ffffff' }}>
          {currentMonth.format('MMMM YYYY')}
        </h3>
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={prevMonth}
            disabled={currentMonth.isSame(minDate, 'month') || currentMonth.isBefore(minDate, 'month')}
            className="p-2 rounded-full border disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            style={{ 
              color: resolvedTheme.text || '#ffffff',
              borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)'
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            disabled={currentMonth.isAfter(maxDate, 'month')}
            className="p-2 rounded-full border disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            style={{ 
              color: resolvedTheme.text || '#ffffff',
              borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)'
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold" style={{ color: resolvedTheme.textMuted || '#71717a' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((d, i) => {
          const isCurrentMonth = d.isSame(currentMonth, 'month');
          const isPast = d.isBefore(minDate, 'day');
          const isTooFar = d.isAfter(maxDate, 'day');
          const isSelected = selectedDate && d.isSame(selectedDate, 'day');
          const isToday = d.isSame(today, 'day');
          
          const available = !isPast && !isTooFar && hasHours(d);
          const disabled = !isCurrentMonth || !available;

          return (
            <button
              type="button"
              key={i}
              onClick={() => !disabled && onSelectDate(d.format('YYYY-MM-DD'))}
              disabled={disabled}
              style={{
                borderRadius: isSharp ? '3px' : '9999px',
                color: isSelected ? getContrastColor(theme) : (!disabled ? (resolvedTheme.text || '#ffffff') : (resolvedTheme.textMuted || '#71717a')),
                borderColor: isSelected ? theme : (isToday ? theme : (resolvedTheme.border || 'rgba(255,255,255,0.1)')),
                ...(isSelected ? { backgroundColor: theme } : {}),
                ...(!isSelected && !disabled ? { backgroundColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } : {})
              }}
              className={`
                cal-date-btn aspect-square flex flex-col items-center justify-center text-sm font-medium transition-all relative border
                ${radiusClass}
                ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                ${isSelected ? 'cal-date-selected text-white shadow-lg scale-110 z-10 font-bold' : ''}
                ${!isSelected && isToday ? 'border-2 font-bold' : ''}
              `}
            >
              <span className={!disabled && !isSelected ? 'mb-1' : ''}>{d.date()}</span>
              {!disabled && !isSelected && (
                <div 
                  className="cal-date-active w-1.5 h-1.5 rounded-full absolute bottom-1.5"
                  style={{ backgroundColor: isToday ? (resolvedTheme.text || '#ffffff') : theme }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
