import { getCalendarById } from '@/actions/calendars';
import BookingWizard from './BookingWizard';
import { notFound } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { getResolvedTheme, GOOGLE_FONTS_CATALOG } from '@/utils/calendarThemes';

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

  const themeColor = calendar.themeColor || '#3B82F6';
  const isSharp = calendar.buttonStyle === 'sharp';
  const isPill = calendar.buttonStyle === 'pill';
  const radiusVal = isSharp ? '2px' : isPill ? '9999px' : '12px';

  const resolvedTheme = getResolvedTheme(calendar);
  const activeFont = calendar.fontFamily || 'Plus Jakarta Sans';
  const fontDef = GOOGLE_FONTS_CATALOG.find(f => f.name === activeFont) || GOOGLE_FONTS_CATALOG[0];

  return (
    <>
      {/* Dynamic Google Font Loader */}
      {fontDef && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${fontDef.importUrl}&display=swap`}
        />
      )}

      <div 
        className={isEmbed ? "w-full cal-wrapper" : "min-h-screen flex items-center justify-center p-4 sm:p-6 cal-wrapper"}
        style={{
          '--cal-accent': themeColor,
          '--cal-radius': radiusVal,
          '--cal-bg': resolvedTheme.bg || '#0a0a0a',
          '--cal-card-bg': resolvedTheme.card || '#111111',
          '--cal-sidebar-bg': resolvedTheme.sidebar || '#0e0e0e',
          '--cal-text': resolvedTheme.text || '#ffffff',
          '--cal-text-secondary': resolvedTheme.textSecondary || '#a1a1aa',
          '--cal-text-muted': resolvedTheme.textMuted || '#71717a',
          '--cal-border': resolvedTheme.border || 'rgba(255,255,255,0.1)',
          '--cal-font': activeFont,
          backgroundColor: isEmbed ? 'transparent' : (resolvedTheme.bg || '#0a0a0a'),
          color: resolvedTheme.text || '#ffffff',
          fontFamily: `'${activeFont}', sans-serif`
        }}
      >
        <div 
          className={`cal-container w-full ${isEmbed ? 'max-w-none bg-transparent' : 'max-w-4xl rounded-2xl shadow-2xl border'} overflow-hidden flex flex-col md:flex-row relative transition-colors`}
          style={{
            backgroundColor: isEmbed ? 'transparent' : (resolvedTheme.card || '#111111'),
            borderColor: isEmbed ? 'transparent' : (resolvedTheme.border || 'rgba(255,255,255,0.1)'),
          }}
        >
          
          {/* Left Side: Event Details */}
          <div 
            className={`cal-sidebar w-full md:w-1/3 p-8 border-b md:border-b-0 md:border-r flex flex-col relative overflow-hidden transition-colors`}
            style={{
              backgroundColor: isEmbed ? 'rgba(0,0,0,0.03)' : (resolvedTheme.sidebar || '#0e0e0e'),
              borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)',
            }}
          >
            {/* Theme Color Accent */}
            <div 
              className="absolute top-0 left-0 w-full h-1.5 shadow-[0_0_12px_var(--cal-accent)]" 
              style={{ background: themeColor }}
            />
            
            <div className="mb-6 flex flex-col items-center text-center">
              {calendar.logoUrl ? (
                <div 
                  className="cal-logo w-24 h-24 mb-4 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner border"
                  style={{
                    backgroundColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)'
                  }}
                >
                  <img src={calendar.logoUrl} alt={`${calendar.name} Logo`} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div 
                  className="cal-logo w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    backgroundColor: resolvedTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)'
                  }}
                >
                  <CalendarIcon className="w-6 h-6" style={{ color: resolvedTheme.text || '#ffffff' }} />
                </div>
              )}
              <h1 className="cal-title text-2xl font-bold mb-2" style={{ color: resolvedTheme.text || '#ffffff' }}>
                {calendar.name}
              </h1>
              
              <div className="flex flex-col gap-3 mt-4 text-sm w-full items-center" style={{ color: resolvedTheme.textSecondary || '#a1a1aa' }}>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: themeColor }} />
                  <span className="capitalize font-medium">{calendar.platform === 'gmeet' ? 'Google Meet' : calendar.platform}</span>
                </div>
              </div>
            </div>

            {calendar.description && (
              <div 
                className="cal-description mt-6 pt-6 border-t max-w-none text-sm leading-relaxed"
                style={{ 
                  borderColor: resolvedTheme.border || 'rgba(255,255,255,0.1)',
                  color: resolvedTheme.textSecondary || '#a1a1aa'
                }}
                dangerouslySetInnerHTML={{ __html: calendar.description }}
              />
            )}
          </div>

          {/* Details Section */}
          <div className="cal-main flex-1 p-6 md:p-8 relative">
            <BookingWizard calendar={calendar} questions={questions} resolvedTheme={resolvedTheme} />
          </div>
        </div>
      </div>
    </>
  );
}
