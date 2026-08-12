'use client';

import React from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPicker({ selectedDate, onSelectDate, calendar }) {
  const [currentMonth, setCurrentMonth] = React.useState(dayjs().startOf('month'));
  
  const today = dayjs().startOf('day');
  
  const dateRangeType = calendar?.dateRangeType || 'days_in_future';
  const futureLimitType = calendar?.futureLimitType || 'calendar_days';
  const futureLimit = calendar?.futureLimit || 30;
  const availability = calendar?.availability || {};

  let minDate = today;
  if (dateRangeType === 'date_range' && calendar?.dateRangeStart) {
    const rangeStart = dayjs(calendar.dateRangeStart).startOf('day');
    if (rangeStart.isAfter(minDate)) {
      minDate = rangeStart;
    }
  }

  let maxDate;
  if (dateRangeType === 'indefinite') {
    maxDate = today.add(90, 'day');
  } else if (dateRangeType === 'date_range' && calendar?.dateRangeEnd) {
    maxDate = dayjs(calendar.dateRangeEnd).startOf('day');
  } else {
    // days_in_future
    if (futureLimitType === 'business_days') {
      let tempDate = today;
      let daysAdded = 0;
      while (daysAdded < futureLimit) {
        tempDate = tempDate.add(1, 'day');
        if (tempDate.day() !== 0 && tempDate.day() !== 6) {
          daysAdded++;
        }
      }
      maxDate = tempDate;
    } else {
      maxDate = today.add(futureLimit, 'day');
    }
  }

  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
  const startDate = startOfMonth.startOf('week'); // Sunday
  const endDate = endOfMonth.endOf('week'); // Saturday

  const calendarDays = [];
  let day = startDate;
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    calendarDays.push(day);
    day = day.add(1, 'day');
  }

  // Determine if a day has any hours available in the weekly schedule
  const hasHours = (date) => {
    const dayName = date.format('dddd').toLowerCase();
    const blocks = availability?.[dayName] || [];
    return blocks.length > 0;
  };

  return (
    <div className="w-full select-none animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">{currentMonth.format('MMMM YYYY')}</h3>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={prevMonth}
            disabled={currentMonth.isSame(minDate, 'month') || currentMonth.isBefore(minDate, 'month')}
            className="p-2 rounded-full border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            disabled={currentMonth.isAfter(maxDate, 'month')}
            className="p-2 rounded-full border border-white/10 text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-text-tertiary">
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
              className={`
                aspect-square rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all relative
                ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/30 scale-110 z-10' : ''}
                ${!disabled && !isSelected && !isToday ? 'bg-white/5 text-white hover:bg-accent-blue/20 hover:text-accent-blue hover:border-accent-blue/50 border border-white/10' : ''}
                ${!isSelected && isToday ? 'bg-accent-blue/20 border-2 border-accent-blue text-white font-bold' : ''}
              `}
            >
              <span className={!disabled && !isSelected ? 'mb-1' : ''}>{d.date()}</span>
              {!disabled && !isSelected && (
                <div className={`w-1 h-1 rounded-full absolute bottom-2 ${isToday ? 'bg-white shadow-[0_0_4px_theme(colors.accent-blue)]' : 'bg-accent-blue/60'}`}></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
