// Bulletproof, cross-client responsive email template generator
// Fully compatible with iOS Mail, Apple Mail, Gmail (Android, iOS, Web), Outlook (Desktop, 365, Web),
// ProtonMail, Zoho Mail, Yahoo Mail, and Dark Mode / Light Mode email clients.

export const DEFAULT_EMAIL_TEMPLATE = {
  type: 'html', // 'html' | 'text'
  subject: 'Confirmed: {{calendar_name}} with {{invitee_name}} on {{date}}',
  fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headline: 'Your Meeting is Confirmed!',
  introNote: 'We look forward to speaking with you. Your session details and connection link are provided below.',
  showLogo: true,
  showCtaButton: true,
  ctaText: 'Join Video Meeting',
  showDetailsCard: true,
  showAnswers: true,
  footerNote: 'Need to reschedule or have questions? Simply reply directly to this email.',
  textBody: `Hi {{invitee_name}},

Your meeting "{{calendar_name}}" is confirmed!

📅 Date: {{date}}
⏰ Time: {{time}} ({{timezone}})
📍 Location: {{location}}
🔗 Meeting Link: {{meet_url}}

{{answers}}

We look forward to speaking with you.
If you need to reschedule or have questions, please reply directly to this email.`,
  customHtml: '', // For advanced custom raw HTML override
  isRawHtml: false
};

export const SAMPLE_PREVIEW_DATA = {
  invitee_name: 'Alex Johnson',
  invitee_email: 'alex.johnson@example.com',
  calendar_name: '30 Min Consultation Call',
  host_name: 'Automatix Host',
  date: 'Friday, August 28, 2026',
  time: '10:00 AM',
  timezone: 'Asia/Calcutta (GMT+5:30)',
  location: 'Google Meet',
  meet_url: 'https://meet.google.com/abc-defg-hij',
  answers: {
    'Company Name': 'Acme Growth Labs',
    'Goal for this call': 'Automate lead booking & client email workflows',
    'Phone Number': '+1 (555) 019-2834'
  }
};

export function substitutePlaceholders(text, data = SAMPLE_PREVIEW_DATA) {
  if (!text) return '';
  let result = text;
  
  const answersFormatted = data.answers && typeof data.answers === 'object' && Object.keys(data.answers).length > 0
    ? Object.entries(data.answers).map(([k, v]) => `• ${k}: ${v}`).join('\n')
    : '';

  const replacements = {
    '{{invitee_name}}': data.invitee_name || 'Invitee',
    '{{invitee_email}}': data.invitee_email || '',
    '{{calendar_name}}': data.calendar_name || 'Meeting',
    '{{host_name}}': data.host_name || 'Host',
    '{{date}}': data.date || '',
    '{{time}}': data.time || '',
    '{{timezone}}': data.timezone || '',
    '{{location}}': data.location || 'Online',
    '{{meet_url}}': data.meet_url || '',
    '{{answers}}': answersFormatted,
  };

  Object.entries(replacements).forEach(([key, val]) => {
    result = result.split(key).join(val);
  });

  return result;
}

export function renderTextEmailTemplate({ template = {}, calendar = {}, data = SAMPLE_PREVIEW_DATA }) {
  const config = { ...DEFAULT_EMAIL_TEMPLATE, ...template };
  const rawText = config.textBody || DEFAULT_EMAIL_TEMPLATE.textBody;
  return substitutePlaceholders(rawText, {
    ...SAMPLE_PREVIEW_DATA,
    calendar_name: calendar.name || SAMPLE_PREVIEW_DATA.calendar_name,
    meet_url: calendar.meetUrl || SAMPLE_PREVIEW_DATA.meet_url,
    location: calendar.platform === 'gmeet' ? 'Google Meet' : (calendar.platform === 'zoom' ? 'Zoom' : 'Phone Call'),
    ...data
  });
}

export function renderHtmlEmailTemplate({ template = {}, calendar = {}, data = SAMPLE_PREVIEW_DATA, isDarkMode = false }) {
  const config = { ...DEFAULT_EMAIL_TEMPLATE, ...template };

  const mergedData = {
    ...SAMPLE_PREVIEW_DATA,
    calendar_name: calendar.name || SAMPLE_PREVIEW_DATA.calendar_name,
    meet_url: calendar.meetUrl || SAMPLE_PREVIEW_DATA.meet_url,
    location: calendar.platform === 'gmeet' ? 'Google Meet' : (calendar.platform === 'zoom' ? 'Zoom' : 'Phone Call'),
    ...data
  };

  if (config.isRawHtml && config.customHtml) {
    return substitutePlaceholders(config.customHtml, mergedData);
  }

  const themeColor = calendar.themeColor || '#3B82F6';
  const logoUrl = calendar.logoUrl || '';
  const font = config.fontFamily || DEFAULT_EMAIL_TEMPLATE.fontFamily;
  const isSharp = calendar.buttonStyle === 'sharp';
  const isPill = calendar.buttonStyle === 'pill';
  const btnRadius = isSharp ? '2px' : isPill ? '9999px' : '8px';
  const cardRadius = isSharp ? '4px' : '12px';

  // Dark vs Light Mode color variables
  const bgMain = isDarkMode ? '#0d0d0d' : '#f4f5f7';
  const bgCard = isDarkMode ? '#161616' : '#ffffff';
  const bgSubCard = isDarkMode ? '#202020' : '#f8fafc';
  const textPrimary = isDarkMode ? '#ffffff' : '#111827';
  const textSecondary = isDarkMode ? '#a1a1aa' : '#4b5563';
  const textTertiary = isDarkMode ? '#71717a' : '#9ca3af';
  const borderColor = isDarkMode ? '#27272a' : '#e5e7eb';
  const subBorderColor = isDarkMode ? '#333338' : '#e2e8f0';

  const headline = substitutePlaceholders(config.headline || DEFAULT_EMAIL_TEMPLATE.headline, mergedData);
  const introNote = substitutePlaceholders(config.introNote || DEFAULT_EMAIL_TEMPLATE.introNote, mergedData);
  const footerNote = substitutePlaceholders(config.footerNote || DEFAULT_EMAIL_TEMPLATE.footerNote, mergedData);
  const ctaText = config.ctaText || 'Join Video Meeting';

  const answersEntries = mergedData.answers && typeof mergedData.answers === 'object' 
    ? Object.entries(mergedData.answers) 
    : [];

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="${isDarkMode ? 'dark' : 'light'}">
  <meta name="supported-color-schemes" content="${isDarkMode ? 'dark' : 'light'}">
  <title>${substitutePlaceholders(config.subject || DEFAULT_EMAIL_TEMPLATE.subject, mergedData)}</title>
  <!--[if mso]>
  <style>
    * { font-family: sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${bgMain}; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgMain}; font-family: ${font}; color: ${textPrimary}; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text (Invisible in body, visible in inbox list) -->
  <div style="display: none; font-size: 1px; color: ${bgMain}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your meeting ${mergedData.calendar_name} is confirmed for ${mergedData.date} at ${mergedData.time}.
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="background-color: ${bgMain};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" class="email-container" style="max-width: 580px; width: 100%; background-color: ${bgCard}; border: 1px solid ${borderColor}; border-radius: ${cardRadius}; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td height="5" style="background-color: ${themeColor}; font-size: 0px; line-height: 0px;">&nbsp;</td>
          </tr>

          <!-- Header / Logo -->
          ${config.showLogo !== false && logoUrl ? `
          <tr>
            <td align="center" style="padding: 28px 24px 8px 24px;">
              <img src="${logoUrl}" alt="${mergedData.calendar_name} Logo" style="max-height: 48px; max-width: 180px; object-contain: contain; display: block;" border="0">
            </td>
          </tr>
          ` : ''}

          <!-- Headline & Greeting -->
          <tr>
            <td style="padding: ${config.showLogo !== false && logoUrl ? '16px' : '28px'} 28px 12px 28px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; line-height: 1.3; color: ${textPrimary};">
                ${headline}
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${textSecondary};">
                ${introNote}
              </p>
            </td>
          </tr>

          <!-- Details Card Section -->
          ${config.showDetailsCard !== false ? `
          <tr>
            <td style="padding: 16px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${bgSubCard}; border: 1px solid ${subBorderColor}; border-radius: ${cardRadius};">
                <tr>
                  <td style="padding: 20px;">
                    <!-- Event Name -->
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${themeColor}; margin-bottom: 4px;">
                      Event Details
                    </div>
                    <div style="font-size: 17px; font-weight: 700; color: ${textPrimary}; margin-bottom: 16px;">
                      ${mergedData.calendar_name}
                    </div>

                    <!-- Date & Time Row -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid ${subBorderColor};">
                      <tr>
                        <td style="padding-top: 12px; padding-bottom: 10px; width: 28px; vertical-align: top;">
                          📅
                        </td>
                        <td style="padding-top: 12px; padding-bottom: 10px; vertical-align: top;">
                          <div style="font-size: 11px; color: ${textTertiary}; text-transform: uppercase; font-weight: 600;">Date</div>
                          <div style="font-size: 14px; font-weight: 600; color: ${textPrimary};">${mergedData.date}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 10px; width: 28px; vertical-align: top;">
                          ⏰
                        </td>
                        <td style="padding-bottom: 10px; vertical-align: top;">
                          <div style="font-size: 11px; color: ${textTertiary}; text-transform: uppercase; font-weight: 600;">Time & Timezone</div>
                          <div style="font-size: 14px; font-weight: 600; color: ${textPrimary};">${mergedData.time} <span style="font-size: 12px; color: ${textSecondary}; font-weight: normal;">(${mergedData.timezone})</span></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 6px; width: 28px; vertical-align: top;">
                          📍
                        </td>
                        <td style="padding-bottom: 6px; vertical-align: top;">
                          <div style="font-size: 11px; color: ${textTertiary}; text-transform: uppercase; font-weight: 600;">Location</div>
                          <div style="font-size: 14px; font-weight: 600; color: ${textPrimary};">${mergedData.location}</div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          ${config.showCtaButton !== false && mergedData.meet_url ? `
          <tr>
            <td align="center" style="padding: 12px 28px 20px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius: ${btnRadius}; background-color: ${themeColor};">
                    <a href="${mergedData.meet_url}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: ${btnRadius}; display: inline-block; border: 1px solid ${themeColor};">
                      ${ctaText} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-size: 11px; color: ${textTertiary}; margin-top: 8px;">
                Link: <a href="${mergedData.meet_url}" style="color: ${themeColor}; word-break: break-all;">${mergedData.meet_url}</a>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Invitee Custom Answers (if present) -->
          ${config.showAnswers !== false && answersEntries.length > 0 ? `
          <tr>
            <td style="padding: 8px 28px 16px 28px;">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${textSecondary}; margin-bottom: 8px;">
                Your Submitted Information
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${bgSubCard}; border: 1px solid ${subBorderColor}; border-radius: ${cardRadius}; font-size: 13px;">
                ${answersEntries.map(([q, a], idx) => `
                <tr>
                  <td style="padding: 10px 14px; border-bottom: ${idx < answersEntries.length - 1 ? `1px solid ${subBorderColor}` : 'none'};">
                    <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 2px;">${q}</div>
                    <div style="color: ${textSecondary};">${a || '-'}</div>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer Note -->
          <tr>
            <td style="padding: 16px 28px 28px 28px; border-top: 1px solid ${borderColor}; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.4; color: ${textTertiary};">
                ${footerNote}
              </p>
              <div style="font-size: 11px; color: ${textTertiary}; opacity: 0.8;">
                Sent automatically via <strong>Automatix Calendars</strong> • Calendar invite attached (.ics)
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
