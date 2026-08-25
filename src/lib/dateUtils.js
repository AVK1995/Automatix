import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

const KNOWN_DATE_FORMATS = [
  'DD-MM-YYYY', 'DD/MM/YYYY', 'DD.MM.YYYY', 'DD-MM-YY', 'DD/MM/YY', 'DD.MM.YY', 'D-M-YYYY', 'D/M/YYYY', 'D.M.YYYY', 'D-M-YY', 'D/M/YY',
  'MM-DD-YYYY', 'MM/DD/YYYY', 'MM.DD.YYYY', 'MM-DD-YY', 'MM/DD/YY', 'MM.DD.YY', 'M-D-YYYY', 'M/D/YYYY', 'M.D.YYYY', 'M-D-YY', 'M/D/YY',
  'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD', 'YYYY-MM-DDTHH:mm:ss.SSSZ', 'YYYY-MM-DDTHH:mm:ssZ',
  'DD-MMM-YYYY', 'DD MMM YYYY', 'DD MMMM YYYY', 'MMM DD, YYYY', 'MMMM DD, YYYY', 'DD-MMMM-YYYY',
  'DD-MM-YYYY HH:mm', 'DD-MM-YYYY HH:mm:ss', 'DD-MM-YYYY hh:mm A', 'DD-MM-YYYY hh:mm:ss A', 'DD-MM-YYYY hh:mm a', 'DD-MM-YYYY hh:mm:ss a',
  'DD/MM/YYYY HH:mm', 'DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY hh:mm A', 'DD/MM/YYYY hh:mm:ss A',
  'DD.MM.YYYY HH:mm', 'DD.MM.YYYY HH:mm:ss', 'DD.MM.YYYY hh:mm A', 'DD.MM.YYYY hh:mm:ss A',
  'MM-DD-YYYY HH:mm', 'MM-DD-YYYY HH:mm:ss', 'MM-DD-YYYY hh:mm A', 'MM-DD-YYYY hh:mm:ss A',
  'MM/DD/YYYY HH:mm', 'MM/DD/YYYY HH:mm:ss', 'MM/DD/YYYY hh:mm A', 'MM/DD/YYYY hh:mm:ss A',
  'MM.DD.YYYY HH:mm', 'MM.DD.YYYY HH:mm:ss', 'MM.DD.YYYY hh:mm A', 'MM.DD.YYYY hh:mm:ss A',
  'YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD hh:mm A', 'YYYY-MM-DD hh:mm:ss A',
  'YYYY/MM/DD HH:mm', 'YYYY/MM/DD HH:mm:ss', 'YYYY/MM/DD hh:mm A', 'YYYY/MM/DD hh:mm:ss A',
  'DD-MMM-YYYY HH:mm', 'DD MMM YYYY HH:mm', 'DD MMMM YYYY HH:mm', 'MMM DD, YYYY HH:mm', 'MMMM DD, YYYY HH:mm',
  'DD-MMM-YYYY hh:mm A', 'DD MMM YYYY hh:mm A', 'DD MMMM YYYY hh:mm A', 'MMM DD, YYYY hh:mm A', 'MMMM DD, YYYY hh:mm A'
];

/**
 * Universal Date and Value Sanitizer for Google Sheets Integration.
 * Supports:
 * - International date formats (DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD, Month DD YYYY, etc.)
 * - Unix Timestamps in Seconds (e.g. 1785074400)
 * - Unix Timestamps in Milliseconds (e.g. 1785074400000)
 * - Microsoft Excel Serial Numbers (e.g. 46257, 46257.70833)
 * - Packed Integer Timestamps (e.g. 20260624165830, 202606241658, 20260624, 24062026)
 * - Hybrid 24h + PM strings, Timezones, and ISO 8601 strings.
 * 
 * Normalizes valid dates to 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss' so Google Sheets'
 * USER_ENTERED parser instantly recognizes and formats them as native Date serial numbers.
 */
export function cleanValueForSheets(val, parseValues = true) {
  if (val === undefined || val === null) return '';
  if (parseValues === false) return String(val);
  
  let s = (typeof val === 'number') ? String(val) : (typeof val === 'string' ? val.trim() : '');
  if (!s) return val;

  // 1. Packed YYYYMMDDHHmmss (14 digits)
  if (/^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])([0-5]\d)([0-5]\d)$/.test(s)) {
    const d = dayjs(s, 'YYYYMMDDHHmmss');
    if (d.isValid()) return d.format('YYYY-MM-DD HH:mm:ss');
  }

  // 2. Packed YYYYMMDDHHmm (12 digits)
  if (/^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])([0-5]\d)$/.test(s)) {
    const d = dayjs(s, 'YYYYMMDDHHmm');
    if (d.isValid()) return d.format('YYYY-MM-DD HH:mm:00');
  }

  // 3. Unix Milliseconds (13 digits e.g. 1785074400000)
  if (/^\d{13}$/.test(s)) {
    const num = Number(s);
    if (num >= 946684800000 && num <= 2524608000000) {
      const d = dayjs(num);
      if (d.isValid()) return d.format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // 4. Unix Seconds (10 digits e.g. 1785074400)
  if (/^\d{10}$/.test(s)) {
    const num = Number(s);
    if (num >= 946684800 && num <= 2524608000) {
      const d = dayjs.unix(num);
      if (d.isValid()) return d.format('YYYY-MM-DD HH:mm:ss');
    }
  }

  // 5. Microsoft Excel Serial Number (e.g. 46257 or 46257.70833, representing ~1995 to ~2078)
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial >= 35000 && serial <= 65000) {
      // Excel epoch: Jan 1 1900. Offset between 1900-01-01 and 1970-01-01 is 25569 days.
      const ms = (serial - 25569) * 86400 * 1000;
      const d = dayjs.utc(ms);
      if (d.isValid()) {
        const hasTime = s.includes('.');
        return hasTime ? d.format('YYYY-MM-DD HH:mm:ss') : d.format('YYYY-MM-DD');
      }
    }
  }

  // 6. Normalize 24h + meridiem redundancy (e.g. '16:58 PM' -> '16:58')
  s = s.replace(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:AM|PM)/i, (m, time) => {
    const [h] = time.split(':');
    return parseInt(h, 10) > 12 ? time : m;
  });

  // 7. Normalize 8-digit compact strings (e.g. 24062026, 20260624)
  if (/^\d{8}$/.test(s)) {
    if (s.startsWith('20') || s.startsWith('19')) {
      s = s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    } else {
      s = s.slice(0, 2) + '-' + s.slice(2, 4) + '-' + s.slice(4, 8);
    }
  }

  // 8. Try standard ISO parse
  const isoParsed = dayjs(s);
  if (isoParsed.isValid() && s.includes('T')) {
    return isoParsed.format('YYYY-MM-DD HH:mm:ss');
  }

  // 9. Try known custom formats
  for (const fmt of KNOWN_DATE_FORMATS) {
    const d = dayjs(s, fmt, true);
    if (d.isValid()) {
      const hasTime = fmt.includes('HH') || fmt.includes('hh');
      return hasTime ? d.format('YYYY-MM-DD HH:mm:ss') : d.format('YYYY-MM-DD');
    }
  }

  // 10. Fallback lenient parse
  const fallback = dayjs(s);
  if (fallback.isValid() && !/^\d+$/.test(s)) {
    const hasTime = s.includes(':');
    return hasTime ? fallback.format('YYYY-MM-DD HH:mm:ss') : fallback.format('YYYY-MM-DD');
  }

  return val;
}
