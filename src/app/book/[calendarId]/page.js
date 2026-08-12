import { getCalendarById } from '@/actions/calendars';
import BookingWizard from './BookingWizard';
import { notFound } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

export async function generateMetadata({ params }) {
  try {
    const { calendarId } = await params;
    const calendar = await getCalendarById(calendarId);
    return {
      title: `${calendar.name} | Automatix`,
      description: calendar.description || 'Schedule a meeting',
    };
  } catch (err) {
    return { title: 'Event Not Found' };
  }
}

export default async function BookingPage({ params, searchParams }) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = await params;
  
  const isEmbed = resolvedSearchParams.embed === 'true';
  let calendar;
  try {
    calendar = await getCalendarById(resolvedParams.calendarId);
    if (!calendar.isActive) throw new Error('Inactive');
  } catch (err) {
    notFound();
  }

  // Parse questions from JSON
  const questions = Array.isArray(calendar.questions) ? calendar.questions : [];

  return (
    <div className={isEmbed ? "w-full" : "min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6"}>
      <div className={`w-full ${isEmbed ? 'max-w-none bg-transparent' : 'max-w-4xl bg-[#111] rounded-2xl shadow-2xl border border-white/10'} overflow-hidden flex flex-col md:flex-row`}>
        
        {/* Left Side: Event Details */}
        <div className={`w-full md:w-1/3 ${isEmbed ? 'bg-black/20' : 'bg-black/40'} p-8 border-b md:border-b-0 md:border-r border-white/10 flex flex-col relative overflow-hidden`}>
          {/* Theme Color Accent */}
          <div 
            className="absolute top-0 left-0 w-full h-1" 
            style={{ backgroundColor: calendar.themeColor || '#3B82F6' }}
          />
          
          <div className="mb-6 flex flex-col items-center text-center">
            {calendar.logoUrl ? (
              <div className="w-24 h-24 mb-4 rounded-xl overflow-hidden flex items-center justify-center bg-white/5 border border-white/10 p-2">
                <img src={calendar.logoUrl} alt={`${calendar.name} Logo`} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white mb-2">{calendar.name}</h1>
            
            <div className="flex flex-col gap-3 mt-4 text-sm text-text-secondary w-full items-center">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="capitalize">{calendar.platform === 'gmeet' ? 'Google Meet' : calendar.platform}</span>
              </div>
            </div>
          </div>

          {calendar.description && (
            <div 
              className="mt-6 pt-6 border-t border-white/10 prose prose-sm prose-invert max-w-none text-text-tertiary"
              dangerouslySetInnerHTML={{ __html: calendar.description }}
            />
          )}
        </div>

        {/* Details Section */}
        <div className="flex-1 p-6 md:p-8 relative">
          <BookingWizard calendar={calendar} questions={questions} />
        </div>
      </div>
    </div>
  );
}
