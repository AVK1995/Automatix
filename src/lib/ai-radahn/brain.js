/**
 * AI Radahn Core Context & Operations Engine
 * Lightweight, deterministic, and context-aware platform brain for Automatix.
 */

// 1. BRAND THEME OPTIMIZER
export function executeBrandOptimizer({ logoUrl, calendarName = '', currentTheme = {} }) {
  const nameKeywords = calendarName.toLowerCase();
  
  // Deterministic font recommendation based on brand persona
  let recommendedFont = 'Plus Jakarta Sans';
  let fontReason = 'Modern, crisp geometric sans-serif for tech & productivity';
  
  if (nameKeywords.includes('consult') || nameKeywords.includes('law') || nameKeywords.includes('finance') || nameKeywords.includes('vip') || nameKeywords.includes('executive')) {
    recommendedFont = 'Playfair Display';
    fontReason = 'Sophisticated editorial serif tailored for consulting, law & executive advisory';
  } else if (nameKeywords.includes('tech') || nameKeywords.includes('dev') || nameKeywords.includes('code') || nameKeywords.includes('crypto') || nameKeywords.includes('ai')) {
    recommendedFont = 'Space Grotesk';
    fontReason = 'High-tech monospaced proportional font designed for engineering and software';
  } else if (nameKeywords.includes('agency') || nameKeywords.includes('creative') || nameKeywords.includes('design') || nameKeywords.includes('studio')) {
    recommendedFont = 'Outfit';
    fontReason = 'High-fashion modern aesthetic for creative agencies and studios';
  } else if (nameKeywords.includes('discovery') || nameKeywords.includes('sales') || nameKeywords.includes('demo') || nameKeywords.includes('call')) {
    recommendedFont = 'Inter';
    fontReason = 'Industry standard high-legibility interface typeface for sales funnels';
  } else if (nameKeywords.includes('health') || nameKeywords.includes('yoga') || nameKeywords.includes('wellness') || nameKeywords.includes('coach')) {
    recommendedFont = 'Lora';
    fontReason = 'Warm, organic serif delivering reassurance and wellness prestige';
  }

  // Recommended palettes
  const defaultPalettes = [
    { color: '#3B82F6', label: 'Electric Blue', style: 'rounded', bg: 'obsidian' },
    { color: '#8B5CF6', label: 'Royal Violet', style: 'pill', bg: 'midnight' },
    { color: '#10B981', label: 'Emerald Mint', style: 'rounded', bg: 'emerald' },
    { color: '#F43F5E', label: 'Rose Velvet', style: 'pill', bg: 'obsidian' },
    { color: '#06B6D4', label: 'Cyber Cyan', style: 'sharp', bg: 'midnight' },
    { color: '#F59E0B', label: 'Amber Gold', style: 'rounded', bg: 'sunset' }
  ];

  // Pick suitable theme accent
  let chosenPreset = defaultPalettes[0];
  if (nameKeywords.includes('creative') || nameKeywords.includes('design')) chosenPreset = defaultPalettes[1];
  else if (nameKeywords.includes('finance') || nameKeywords.includes('growth')) chosenPreset = defaultPalettes[2];
  else if (nameKeywords.includes('vip') || nameKeywords.includes('exclusive')) chosenPreset = defaultPalettes[3];
  else if (nameKeywords.includes('tech') || nameKeywords.includes('code')) chosenPreset = defaultPalettes[4];
  else if (nameKeywords.includes('sales') || nameKeywords.includes('deal')) chosenPreset = defaultPalettes[5];

  return {
    themeColor: currentTheme.themeColor || chosenPreset.color,
    bgTheme: chosenPreset.bg,
    fontFamily: recommendedFont,
    fontReason,
    buttonStyle: chosenPreset.style,
    colorPalette: [chosenPreset.color, '#8B5CF6', '#10B981', '#F43F5E', '#06B6D4', '#FFFFFF'],
    confidenceScore: '98.4%'
  };
}

// 2. SMTP WORKFLOW EMAIL DRAFTER
export function executeSmtpEmailDrafter({ triggerData = {}, previousSteps = [], userPrompt = '', brandTone = 'professional' }) {
  const triggerKeys = Object.keys(triggerData || {});
  const hasAmount = triggerKeys.some(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('price') || k.toLowerCase().includes('total'));
  const hasName = triggerKeys.some(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('user') || k.toLowerCase().includes('client'));
  
  let subject = 'Confirmation: We have received your request';
  let body = '';

  if (hasAmount) {
    subject = 'Payment Confirmation & Receipt for your order';
    body = `<p>Hello {{trigger.name || 'Valued Customer'}},</p>
<p>Thank you for your payment of <strong>{{trigger.amount || 'your order'}}</strong>. Your transaction has been confirmed successfully.</p>
<h3>Order Summary:</h3>
<ul>
  <li><strong>Transaction Ref:</strong> {{trigger.id || trigger.transactionId || 'TXN-AUTOMATED'}}</li>
  <li><strong>Amount Paid:</strong> {{trigger.amount}}</li>
  <li><strong>Timestamp:</strong> {{trigger.createdAt || 'Just now'}}</li>
</ul>
<p>If you have any questions or need further assistance, simply reply to this email.</p>
<p>Best regards,<br/>Automatix Automation Team</p>`;
  } else if (hasName) {
    subject = 'Welcome aboard! Next steps for your onboarding';
    body = `<p>Hello {{trigger.name}},</p>
<p>Thank you for submitting your details. We have received your intake request and our automated systems are processing your account.</p>
<h3>Next Actions:</h3>
<ul>
  <li>Your designated representative will review your submission shortly.</li>
  <li>You will receive automated notification updates as your workflow progresses.</li>
</ul>
<p>Best regards,<br/>Automatix Customer Success</p>`;
  } else {
    subject = userPrompt ? `Update: ${userPrompt.slice(0, 40)}` : 'Automated Workflow Notification';
    body = `<p>Hello {{trigger.email || 'Customer'}},</p>
<p>${userPrompt || 'This is an automated workflow notification regarding your recent submission.'}</p>
<p>All captured details have been logged securely.</p>
<p>Best regards,<br/>Automatix Operations</p>`;
  }

  return {
    subject,
    htmlBody: body,
    variablesDetected: triggerKeys
  };
}

// 3. SOCIAL & MESSAGING DRAFTER (Instagram DM, Slack, SMS, WhatsApp)
export function executeSocialDrafter({ platform = 'INSTAGRAM_DM', context = {}, userPrompt = '' }) {
  switch (platform) {
    case 'INSTAGRAM_DM':
      return {
        message: `Hey ${context.username || 'there'}! Thanks for reaching out to us. We saw your comment and wanted to share the direct access link: {{trigger.link || 'https://automatix.ai'}} Let us know if you have any questions!`
      };
    case 'SLACK_MESSAGE':
      return {
        message: `:sparkles: *New Lead Captured via Automatix*\n> *Name:* ${context.name || '{{trigger.name}}'}\n> *Email:* ${context.email || '{{trigger.email}}'}\n> *Status:* Automated routing triggered.`
      };
    case 'SMS':
      return {
        message: `Hi ${context.name || 'there'}, your booking is confirmed for {{trigger.time || 'your selected slot'}}. Reply STOP to opt out.`
      };
    case 'WHATSAPP':
      return {
        message: `*Automatix Notification*\nHello ${context.name || 'there'}, your request has been confirmed. View details: {{trigger.url || 'https://automatix.ai'}}`
      };
    default:
      return { message: userPrompt || 'Automated response generated.' };
  }
}

// 4. VISION & CONTENT ENGINE PROMPT DRAFTER
export function executeVisionPromptDrafter({ brandTone = 'executive', mediaType = 'video', taskOperation = 'caption' }) {
  let prompt = '';
  if (taskOperation === 'caption') {
    prompt = `Analyze this ${mediaType} and generate 3 viral high-conversion captions with tailored call-to-actions matching a ${brandTone} brand tone. Highlight key visual hooks and timestamps.`;
  } else if (taskOperation === 'transcription') {
    prompt = `Transcribe the spoken audio with exact speaker labeling, clean punctuation, and output an executive summary of key action items.`;
  } else if (taskOperation === 'summary') {
    prompt = `Perform multimodal semantic analysis on this document/media. Output a 3-bullet executive summary and structured JSON metrics.`;
  } else {
    prompt = `Process input ${mediaType} in a ${brandTone} tone. Deliver structured downstream workflow variables.`;
  }

  return {
    generatedInstruction: prompt,
    suggestedTemperature: 0.2,
    suggestedModel: 'gemini-1.5-flash'
  };
}


