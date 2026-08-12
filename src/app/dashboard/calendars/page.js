import { Suspense } from 'react';
import CalendarManager from './CalendarManager';
import { getCalendars } from '@/actions/calendars';

export const metadata = {
  title: 'My Calendars | Automatix',
  description: 'Manage your Premium Calendars and events.',
};

export default async function CalendarsPage() {
  const initialCalendars = await getCalendars();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">My Calendars</h1>
          <p className="text-text-secondary">Create and manage your premium scheduling events.</p>
        </div>
        
        <Suspense fallback={<div className="text-white">Loading calendars...</div>}>
          <CalendarManager initialCalendars={initialCalendars} />
        </Suspense>
      </div>
    </div>
  );
}
