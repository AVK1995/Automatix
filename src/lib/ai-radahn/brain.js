/**
 * AI Radahn Core Context, UI/UX Design & Copywriting Engine
 * High-performance, deterministic, and context-aware intelligence brain for Automatix.
 * Formats top-tier UI/UX email HTML layouts, responsive dark design systems,
 * and high-converting B2B copywriting across workflows and transactional templates.
 */

import { compileCopyFramework, discoverDesignTokens } from './webDiscovery';

// ==========================================
// 1. DESIGN THEME & PALETTE ONTOLOGY MATRIX
// ==========================================
export function resolveDesignTheme(prompt = '', tone = 'modern_dark') {
  const p = (prompt || '').toLowerCase();
  const t = (tone || '').toLowerCase();

  // A. TACTICAL MILITARY STEALTH
  if (p.includes('call of duty') || p.includes('cod') || p.includes('mw4') || p.includes('mw3') || p.includes('modern warfare') || p.includes('warzone') || p.includes('tactical') || p.includes('military') || p.includes('camo')) {
    return {
      themeName: 'Tactical Military Stealth',
      primaryColor: '#84CC16',
      secondaryColor: '#15803D',
      accentColor: '#F97316',
      gradientBg: 'linear-gradient(135deg, #84CC16 0%, #15803D 100%)',
      buttonShadow: '0 10px 28px rgba(132, 204, 22, 0.45)',
      accentBorder: 'rgba(132, 204, 22, 0.35)',
      tagColor: '#84CC16',
      badgeBg: 'rgba(132, 204, 22, 0.1)',
      textColorOnBtn: '#050505',
      cardBg: '#090c0a',
      cardBorder: 'rgba(132, 204, 22, 0.25)',
      badgeText: 'TACTICAL OPERATIONAL CLEARANCE',
      fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', -apple-system, sans-serif",
      eyebrowGlow: '0 0 12px rgba(132, 204, 22, 0.35)'
    };
  }

  // B. RETRO SUNSET SYNTHWAVE
  if (p.includes('gta 6') || p.includes('gta6') || p.includes('vice city') || p.includes('sunset neon') || p.includes('miami') || p.includes('synthwave')) {
    return {
      themeName: 'Retro Sunset Synthwave',
      primaryColor: '#FF007F',
      secondaryColor: '#7928CA',
      accentColor: '#FF7A00',
      gradientBg: 'linear-gradient(135deg, #FF007F 0%, #7928CA 50%, #FF7A00 100%)',
      buttonShadow: '0 10px 28px rgba(255, 0, 127, 0.45)',
      accentBorder: 'rgba(255, 0, 127, 0.3)',
      tagColor: '#FF007F',
      badgeBg: 'rgba(255, 0, 127, 0.1)',
      textColorOnBtn: '#ffffff',
      cardBg: '#0d0514',
      cardBorder: 'rgba(255, 0, 127, 0.25)',
      badgeText: 'RETRO SYNTHWAVE SYSTEM ACCESS',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      eyebrowGlow: '0 0 12px rgba(255, 0, 127, 0.35)'
    };
  }

  // C. CYBERPUNK 2077 / NEO-TOKYO
  if (p.includes('cyberpunk') || p.includes('neo tokyo') || p.includes('high tech yellow')) {
    return {
      themeName: 'Cyberpunk 2077 / Neo-Tokyo',
      primaryColor: '#FCEE0A',
      secondaryColor: '#00F0FF',
      accentColor: '#00F0FF',
      gradientBg: 'linear-gradient(135deg, #FCEE0A 0%, #00F0FF 100%)',
      buttonShadow: '0 8px 24px rgba(252, 238, 10, 0.4)',
      accentBorder: 'rgba(0, 240, 255, 0.35)',
      tagColor: '#FCEE0A',
      badgeBg: 'rgba(252, 238, 10, 0.1)',
      textColorOnBtn: '#000000',
      cardBg: '#090a0f',
      cardBorder: 'rgba(0, 240, 255, 0.25)',
      badgeText: 'NEO-TOKYO CLOUD PROTOCOL',
      fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', -apple-system, sans-serif",
      eyebrowGlow: '0 0 12px rgba(0, 240, 255, 0.35)'
    };
  }

  // D. VALORANT / APEX / SHARP CRIMSON FPS
  if (p.includes('valorant') || p.includes('apex') || p.includes('crimson') || p.includes('blood red') || p.includes('red accent') || p.includes('red')) {
    return {
      themeName: 'Valorant / Hyper FPS',
      primaryColor: '#FF4655',
      secondaryColor: '#0F1923',
      accentColor: '#FF4655',
      gradientBg: 'linear-gradient(135deg, #FF4655 0%, #D93B48 100%)',
      buttonShadow: '0 10px 28px rgba(255, 70, 85, 0.45)',
      accentBorder: 'rgba(255, 70, 85, 0.35)',
      tagColor: '#FF4655',
      badgeBg: 'rgba(255, 70, 85, 0.1)',
      textColorOnBtn: '#ffffff',
      cardBg: '#0f141c',
      cardBorder: 'rgba(255, 70, 85, 0.25)',
      badgeText: 'SECURITY ACCESS PROTOCOL // ACTIVE',
      fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', -apple-system, sans-serif",
      eyebrowGlow: '0 0 12px rgba(255, 70, 85, 0.35)'
    };
  }

  // E. NEON BLUE / CYBER GLOW / CYAN
  if (p.includes('neon blue') || p.includes('cyan') || p.includes('electric blue') || p.includes('neon') || p.includes('blue') || t === 'cyber_glow') {
    return {
      themeName: 'Cyber Glow & Neon Blue',
      primaryColor: '#00E5FF',
      secondaryColor: '#0072FF',
      accentColor: '#00E5FF',
      gradientBg: 'linear-gradient(135deg, #00E5FF 0%, #0072FF 100%)',
      buttonShadow: '0 8px 24px rgba(0, 229, 255, 0.45)',
      accentBorder: 'rgba(0, 229, 255, 0.35)',
      tagColor: '#00E5FF',
      badgeBg: 'rgba(0, 229, 255, 0.1)',
      textColorOnBtn: '#050505',
      cardBg: '#060b13',
      cardBorder: 'rgba(0, 229, 255, 0.25)',
      badgeText: 'HIGH-SPEED CLOUD ENGINE',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      eyebrowGlow: '0 0 12px rgba(0, 229, 255, 0.35)'
    };
  }

  // F. ENTERPRISE SECURITY / HARDENED SHIELD
  if (p.includes('security') || p.includes('compliance') || p.includes('emerald') || p.includes('green') || t === 'enterprise_security') {
    return {
      themeName: 'Enterprise Security Protocol',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#34D399',
      gradientBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      buttonShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
      accentBorder: 'rgba(16, 185, 129, 0.3)',
      tagColor: '#34D399',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      textColorOnBtn: '#ffffff',
      cardBg: '#060e0a',
      cardBorder: 'rgba(16, 185, 129, 0.25)',
      badgeText: 'ENTERPRISE SECURITY VERIFICATION',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      eyebrowGlow: '0 0 12px rgba(16, 185, 129, 0.3)'
    };
  }

  // G. VIP LUXURY / GOLD OBSIDIAN / ORANGE
  if (p.includes('gold') || p.includes('amber') || p.includes('orange') || p.includes('luxury') || p.includes('vip') || p.includes('exclusive') || t === 'luxury_executive') {
    return {
      themeName: 'VIP Luxury Obsidian',
      primaryColor: '#F59E0B',
      secondaryColor: '#D97706',
      accentColor: '#FBBF24',
      gradientBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      buttonShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
      accentBorder: 'rgba(245, 158, 11, 0.3)',
      tagColor: '#FBBF24',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      textColorOnBtn: '#050505',
      cardBg: '#0f0c05',
      cardBorder: 'rgba(245, 158, 11, 0.25)',
      badgeText: 'VIP EXECUTIVE CONCIERGE',
      fontFamily: "'Playfair Display', 'Plus Jakarta Sans', Georgia, serif",
      eyebrowGlow: '0 0 12px rgba(245, 158, 11, 0.3)'
    };
  }

  // H. MINIMALIST / CLEAN MONOCHROME
  if (p.includes('minimal') || p.includes('white') || p.includes('monochrome') || p.includes('apple') || t === 'minimalist') {
    return {
      themeName: 'Minimalist Monochrome',
      primaryColor: '#FFFFFF',
      secondaryColor: '#E2E8F0',
      accentColor: '#E2E8F0',
      gradientBg: '#FFFFFF',
      buttonShadow: '0 4px 14px rgba(255, 255, 255, 0.2)',
      accentBorder: 'rgba(255, 255, 255, 0.2)',
      tagColor: '#E2E8F0',
      badgeBg: 'rgba(255, 255, 255, 0.05)',
      textColorOnBtn: '#000000',
      cardBg: '#0d0d0d',
      cardBorder: 'rgba(255, 255, 255, 0.15)',
      badgeText: 'TRANSACTIONAL NOTIFICATION',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      eyebrowGlow: 'none'
    };
  }

  // I. MODERN DARK (DEFAULT OBSIDIAN & ROYAL VIOLET)
  return {
    themeName: 'Modern Dark Obsidian',
    primaryColor: '#8B5CF6',
    secondaryColor: '#6366F1',
    accentColor: '#A78BFA',
    gradientBg: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    buttonShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
    accentBorder: 'rgba(139, 92, 246, 0.3)',
    tagColor: '#A78BFA',
    badgeBg: 'rgba(139, 92, 246, 0.1)',
    textColorOnBtn: '#ffffff',
    cardBg: '#0e0e0e',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    badgeText: 'AUTOMATED SYSTEM IDENTITY GUARD',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    eyebrowGlow: '0 0 12px rgba(139, 92, 246, 0.3)'
  };
}

// Logo SVG Component Helper
function renderBrandLogoSvg() {
  return `
  <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
    <tr>
      <td style="vertical-align: middle; padding-right: 10px;">
        <svg viewBox="0 0 100 100" width="30" height="30" style="display: block;">
          <defs>
            <linearGradient id="brandLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f8fafc" />
              <stop offset="50%" stop-color="#cbd5e1" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>
          </defs>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M41.5 15L15 90h18l7.5-22.5h20L67.5 90h18L58.5 15h-17zM45 45l5-15 5 15h-10z" fill="url(#brandLogoGrad)" />
        </svg>
      </td>
      <td style="vertical-align: middle; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Automatix
      </td>
    </tr>
  </table>`;
}

// ==========================================
// 2. SURGICAL TEMPLATE REFINEMENT ENGINE
// ==========================================
export function refineEmailTemplateHtml(html = '', instruction = '') {
  if (!html) return html;
  let out = html;
  const p = (instruction || '').toLowerCase();
  const theme = resolveDesignTheme(instruction);

  // 1. Remove Eyebrow / Brand Badge
  if (p.includes('remove eyebrow') || p.includes('no eyebrow') || p.includes('without eyebrow') || p.includes('hide eyebrow') || p.includes('remove badge') || p.includes('no badge')) {
    out = out.replace(/<div class=["']brand-badge["']>[\s\S]*?<\/div>/gi, '');
    out = out.replace(/<div class=["']badge["']>[\s\S]*?<\/div>/gi, '');
  }

  // 2. Change / Add Eyebrow
  const eyebrowMatch = instruction.match(/(?:change|set|use)\s+(?:the\s+)?eyebrow\s+(?:to\s+|as\s+)?["']?([^"'\n,]+)["']?/i);
  if (eyebrowMatch && !p.includes('remove') && !p.includes('no eyebrow')) {
    const newEyebrow = eyebrowMatch[1].trim();
    if (out.includes('brand-badge')) {
      out = out.replace(/<div class=["']brand-badge["']>[\s\S]*?<\/div>/gi, `<div class="brand-badge">${newEyebrow}</div>`);
    } else if (out.includes('badge')) {
      out = out.replace(/<div class=["']badge["']>[\s\S]*?<\/div>/gi, `<div class="badge">${newEyebrow}</div>`);
    } else {
      out = out.replace(/<div class=["']container["']>/gi, `<div class="container">\n      <div class="brand-badge">${newEyebrow}</div>`);
    }
  }

  // 3. Remove Logo
  if (p.includes('remove logo') || p.includes('no logo') || p.includes('without logo')) {
    out = out.replace(/<table[^>]*class=["']logo-container["'][\s\S]*?<\/table>/gi, '');
    out = out.replace(/<table[^>]*class=["']logo-table["'][\s\S]*?<\/table>/gi, '');
    out = out.replace(/<table[^>]*align=["']center["'][^>]*>[\s\S]*?M41\.5 15L15 90[\s\S]*?<\/table>/gi, '');
  }

  // 4. Remove Security / Expiry Notice
  if (p.includes('remove security') || p.includes('remove expiry') || p.includes('no expiry') || p.includes('no security notice') || p.includes('without security notice') || p.includes('no disclaimer')) {
    out = out.replace(/<div[^>]*style=["'][^"']*rgba\(255,\s*255,\s*255,\s*0\.03\)[\s\S]*?Security Notice[\s\S]*?<\/div>\s*<\/div>/gi, '');
    out = out.replace(/<div class=["']security-box["']>[\s\S]*?<\/div>/gi, '');
  }

  // 5. Remove Footer
  if (p.includes('remove footer') || p.includes('no footer')) {
    out = out.replace(/<div class=["']footer["']>[\s\S]*?<\/div>/gi, '');
  }

  // 6. Change CTA Button Text
  const btnTextMatch = instruction.match(/(?:button|cta)(?:\s+text|\s+say|\s+label)?\s+(?:to\s+|as\s+|should\s+say\s+)?["']([^"'\n]+)["']/i) ||
                       instruction.match(/(?:change|set|make)\s+(?:the\s+)?(?:button|cta)\s+(?:to\s+|say\s+)?["']?([^"'\n,]+)["']?/i);
  if (btnTextMatch) {
    const newBtnText = btnTextMatch[1].trim();
    if (!newBtnText.includes('color') && !newBtnText.includes('green') && !newBtnText.includes('blue') && !newBtnText.includes('orange') && !newBtnText.includes('camo') && !newBtnText.includes('purple')) {
      out = out.replace(/(<a[^>]*class=["']btn["'][^>]*>)([\s\S]*?)(<\/a>)/gi, `$1${newBtnText}$3`);
    }
  }

  // 7. Change Headline / Title
  const titleMatch = instruction.match(/(?:headline|title)\s+(?:to\s+|as\s+)?["']([^"'\n]+)["']/i) ||
                     instruction.match(/(?:change|set|make)\s+(?:the\s+)?(?:headline|title)\s+(?:to\s+)?["']?([^"'\n,]+)["']?/i);
  if (titleMatch) {
    const newTitle = titleMatch[1].trim();
    out = out.replace(/(<h1[^>]*class=["']title["'][^>]*>)([\s\S]*?)(<\/h1>)/gi, `$1${newTitle}$3`);
  }

  // 8. Change Colors / Theme / CTA Color
  if (p.includes('camo') || p.includes('call of duty') || p.includes('tactical') || p.includes('lime') || p.includes('mw4') || p.includes('modern warfare') || p.includes('green') || p.includes('orange') || p.includes('gta') || p.includes('pink') || p.includes('purple') || p.includes('blue') || p.includes('cyan') || p.includes('yellow') || p.includes('gold') || p.includes('red')) {
    out = out.replace(/background:\s*linear-gradient\([^;]+\);/gi, `background: ${theme.gradientBg};`);
    out = out.replace(/box-shadow:\s*0\s+[0-9]+px\s+[0-9]+px\s+rgba\([^)]+\);/gi, `box-shadow: ${theme.buttonShadow};`);
    out = out.replace(/border:\s*1px\s+solid\s+rgba\([^)]+\);/gi, `border: 1px solid ${theme.cardBorder};`);
  }

  return out;
}

// ==========================================
// 3. BRAND THEME OPTIMIZER
// ==========================================
export function executeBrandOptimizer({ logoUrl, calendarName = '', currentTheme = {} }) {
  const nameKeywords = calendarName.toLowerCase();
  
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

  const defaultPalettes = [
    { color: '#3B82F6', label: 'Electric Blue', style: 'rounded', bg: 'obsidian' },
    { color: '#8B5CF6', label: 'Royal Violet', style: 'pill', bg: 'midnight' },
    { color: '#10B981', label: 'Emerald Mint', style: 'rounded', bg: 'emerald' },
    { color: '#F43F5E', label: 'Rose Velvet', style: 'pill', bg: 'obsidian' },
    { color: '#06B6D4', label: 'Cyber Cyan', style: 'sharp', bg: 'midnight' },
    { color: '#F59E0B', label: 'Amber Gold', style: 'rounded', bg: 'sunset' }
  ];

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

// ==========================================
// 4. WORKFLOW CONTEXT-AWARE SMTP DRAFTER
// ==========================================
export function executeSmtpEmailDrafter({ triggerData = {}, previousSteps = [], userPrompt = '', brandTone = 'professional' }) {
  const triggerKeys = Object.keys(triggerData || {});
  const theme = resolveDesignTheme(userPrompt, brandTone);
  const promptLower = (userPrompt || '').toLowerCase();

  // Negative prompt removals
  const hasNoEyebrow = promptLower.includes('remove eyebrow') || 
                       promptLower.includes('no eyebrow') || 
                       promptLower.includes('without eyebrow') || 
                       promptLower.includes('hide eyebrow') || 
                       promptLower.includes('remove the eyebrow') ||
                       promptLower.includes('remove badge') ||
                       promptLower.includes('no badge');

  const hasNoLogo = promptLower.includes('remove logo') || promptLower.includes('no logo') || promptLower.includes('without logo');
  const hasNoFooter = promptLower.includes('remove footer') || promptLower.includes('no footer');

  // Workflow context introspection
  const hasAiStep = previousSteps.some(s => s.type?.includes('ai') || s.type?.includes('vision') || s.title?.toLowerCase().includes('ai'));
  const hasStorage = previousSteps.some(s => s.type?.includes('storage') || s.type?.includes('drive') || s.title?.toLowerCase().includes('storage'));
  const hasSheet = previousSteps.some(s => s.type?.includes('sheet') || s.type?.includes('airtable') || s.title?.toLowerCase().includes('sheet'));
  const hasBooking = previousSteps.some(s => s.type?.includes('booking') || s.type?.includes('calendar') || s.title?.toLowerCase().includes('calendar'));

  let subject = 'Automatix: Notification & Automated Update';
  let headline = 'Automated Workflow Update';
  let buttonText = 'Open Dashboard &rarr;';
  let buttonHref = '{{trigger.fileUrl || trigger.meetUrl || trigger.link || "https://automatix.ai"}}';
  let cardContentHtml = '';

  if (hasAiStep) {
    subject = 'AI Generation Complete: Your Transcripts & Insights are Ready';
    headline = 'AI Content & Media Synthesis Complete';
    buttonText = 'View AI Output in Dashboard';
    cardContentHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.tagColor}; margin-bottom: 8px;">AI Synthesis Highlights</div>
        <div style="font-size: 13px; color: #d1d5db; line-height: 1.6;">
          <strong>Summary:</strong> {{steps.ai_1.summary || 'Content processed with multimodal AI.'}}<br/><br/>
          <strong>Key Takeaways:</strong> {{steps.ai_1.insights || 'Automation rules evaluated successfully.'}}
        </div>
      </div>`;
  } else if (hasStorage) {
    subject = 'Cloud Asset Synchronized: {{trigger.fileName || "New Asset Available"}}';
    headline = 'Cloud File Ready for Download';
    buttonText = 'Download & Inspect Asset';
    buttonHref = '{{trigger.fileUrl || "https://automatix.ai"}}';
    cardContentHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.tagColor}; margin-bottom: 8px;">Synchronized Asset Details</div>
        <div style="font-size: 13px; color: #d1d5db; line-height: 1.6;">
          <strong>File Name:</strong> {{trigger.fileName || 'asset.mp4'}}<br/>
          <strong>File Size:</strong> {{trigger.size || 'Automated Buffer'}}<br/>
          <strong>Source:</strong> Cloud Storage Trigger
        </div>
      </div>`;
  } else if (hasBooking) {
    subject = 'Booking Confirmed: {{trigger.eventTitle || "Your Scheduled Session"}}';
    headline = 'Your Appointment is Confirmed';
    buttonText = 'Join Meeting Room';
    buttonHref = '{{trigger.meetUrl || "https://automatix.ai"}}';
    cardContentHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.tagColor}; margin-bottom: 8px;">Session Overview</div>
        <div style="font-size: 13px; color: #d1d5db; line-height: 1.6;">
          <strong>Event:</strong> {{trigger.eventTitle || 'Strategic Advisory'}}<br/>
          <strong>Date & Time:</strong> {{trigger.startTime || 'Confirmed Slot'}}<br/>
          <strong>Host:</strong> {{trigger.hostName || 'Automatix'}}
        </div>
      </div>`;
  } else if (promptLower.includes('payment') || promptLower.includes('receipt') || promptLower.includes('order')) {
    subject = 'Receipt & Confirmation for Your Order #{{trigger.id || "TXN-AUTO"}}';
    headline = 'Payment Confirmation & Receipt';
    buttonText = 'View Invoice & Receipt';
    cardContentHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.tagColor}; margin-bottom: 8px;">Order Summary</div>
        <div style="font-size: 13px; color: #d1d5db; line-height: 1.6;">
          <strong>Amount Paid:</strong> {{trigger.amount || '$499.00'}}<br/>
          <strong>Transaction Ref:</strong> {{trigger.id || 'TXN-AUTOMATIX'}}<br/>
          <strong>Status:</strong> <span style="color:#10B981; font-weight:bold;">CONFIRMED</span>
        </div>
      </div>`;
  }

  const customIntro = userPrompt ? userPrompt : 'Your automated workflow has executed successfully and your assets have been generated.';
  const eyebrowMarkup = hasNoEyebrow ? '' : `<div class="badge">${theme.badgeText}</div>`;
  const logoMarkup = hasNoLogo ? '' : renderBrandLogoSvg();
  const footerMarkup = hasNoFooter ? '' : `
      <div class="footer">
        &copy; ${new Date().getFullYear()} Automatix Inc. Automated Workflow Engine.<br/>
        Dispatched securely to <span style="color: #a1a1aa;">{{trigger.email || '{{USER_EMAIL}}'}}</span>.
      </div>`;

  const fullHtmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050505; font-family: ${theme.fontFamily}; color: #ffffff; }
    .wrapper { width: 100%; background-color: #050505; padding: 40px 16px; }
    .container { max-width: 540px; margin: 0 auto; background-color: ${theme.cardBg}; border: 1px solid ${theme.cardBorder}; border-radius: 16px; padding: 36px 32px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .badge { display: inline-block; padding: 4px 14px; background-color: ${theme.badgeBg}; border: 1px solid ${theme.accentBorder}; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${theme.tagColor}; margin-bottom: 20px; box-shadow: ${theme.eyebrowGlow}; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.02em; }
    .salutation { font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 8px; text-align: left; }
    .desc { font-size: 14px; color: #a1a1aa; line-height: 1.65; margin: 0 0 20px 0; text-align: left; }
    .btn { display: inline-block; background: ${theme.gradientBg}; color: ${theme.textColorOnBtn} !important; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: -0.01em; box-shadow: ${theme.buttonShadow}; }
    .footer { margin-top: 32px; font-size: 11px; color: #52525b; line-height: 1.5; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${eyebrowMarkup}
      ${logoMarkup}
      <h1 class="title">${headline}</h1>
      
      <div class="salutation">Hello {{trigger.name || trigger.userName || 'there'}},</div>
      <p class="desc">${customIntro}</p>

      ${cardContentHtml}

      <div style="margin: 28px 0;">
        <a href="${buttonHref}" class="btn" target="_blank">${buttonText}</a>
      </div>

      ${footerMarkup}
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    htmlBody: fullHtmlBody,
    variablesDetected: triggerKeys
  };
}

// ==========================================
// 5. SOCIAL & MESSAGING DRAFTER
// ==========================================
export function executeSocialDrafter({ platform = 'INSTAGRAM_DM', context = {}, userPrompt = '' }) {
  switch (platform) {
    case 'INSTAGRAM_DM':
      return {
        message: `Hey ${context.username || 'there'}! Thanks for reaching out. We saw your inquiry and wanted to give you direct access: {{trigger.link || 'https://automatix.ai'}} Let us know if you need anything else!`
      };
    case 'SLACK_MESSAGE':
      return {
        message: `*Automatix Lead Capture Notification*\n> *Name:* ${context.name || '{{trigger.name}}'}\n> *Email:* ${context.email || '{{trigger.email}}'}\n> *Status:* Automated workflow execution complete.`
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

// ==========================================
// 6. VISION & CONTENT ENGINE PROMPT DRAFTER
// ==========================================
export function getPromptExamples({ category = 'video', task = 'generate_caption', tone = 'engaging' }) {
  const cat = (category || 'video').toLowerCase();
  const t = (task || 'generate_caption').toLowerCase();
  const b = (tone || 'engaging').toLowerCase();

  // Video examples
  if (cat.includes('video')) {
    if (t.includes('caption') || t.includes('hashtag') || t.includes('social')) {
      return [
        { label: 'Viral Reel Hook + 15 Hashtags', prompt: 'Analyze this video and generate 3 viral opening hooks, an engaging 3-sentence caption with emojis, and 15 targeted hashtags for Instagram and TikTok.' },
        { label: 'Story CTA + Link in Bio', prompt: 'Create an engaging Instagram Story caption highlighting the core takeaway from this video, ending with a strong call-to-action to check the link in bio.' },
        { label: 'Timestamp Highlights & Key Insights', prompt: 'Watch this video and extract the 3 most impactful moments with approximate timestamps and punchy summaries for our audience.' },
        { label: 'Shorts & Reels Conversion Hook', prompt: 'Draft a catchy click-worthy title (under 50 chars) and an energetic first 3-second hook for YouTube Shorts based on this video.' }
      ];
    } else if (t.includes('summary') || t.includes('key_points')) {
      return [
        { label: 'Executive 3-Bullet Summary', prompt: 'Summarize the core message of this video into 3 crisp, executive-level bullet points.' },
        { label: 'Action Items & Takeaways', prompt: 'Extract actionable checklist items from this video that our team or audience can execute immediately.' },
        { label: 'Q&A Discussion Starters', prompt: 'Generate 3 thought-provoking questions based on this video to drive comments and community engagement.' },
        { label: 'B2B Case Study Snippet', prompt: 'Format this video summary into a professional B2B customer success narrative.' }
      ];
    }
  }

  // Audio examples
  if (cat.includes('audio')) {
    return [
      { label: 'Speaker-Labeled Clean Transcript', prompt: 'Transcribe this audio with exact speaker labeling, timestamps, and remove filler words (ums, uhs).' },
      { label: 'Podcast Show Notes & Chapters', prompt: 'Generate comprehensive podcast show notes including episode title, 1-paragraph overview, and timestamped chapter markers.' },
      { label: 'Key Quotes & Soundbites', prompt: 'Extract the top 3 most memorable, shareable quotes from this audio file.' },
      { label: 'Meeting Action Items & Next Steps', prompt: 'Extract all decisions made and assigned action items from this meeting recording.' }
    ];
  }

  // Image examples
  if (cat.includes('image')) {
    return [
      { label: 'Social Media Post Copy + CTA', prompt: 'Describe the visual elements in this image and write an engaging social media post with a compelling CTA.' },
      { label: 'Product Feature Breakdown', prompt: 'Identify the product shown in this image and list its key visual selling points, materials, and benefits.' },
      { label: 'SEO Alt Text & Description', prompt: 'Generate an accessible, keyword-rich SEO Alt Text (under 125 chars) and a 1-sentence photo description.' },
      { label: 'Ad Copy Variant with Emoji Hook', prompt: 'Write 2 high-converting ad copy variations based on this graphic matching our brand tone.' }
    ];
  }

  // Document / PDF / CSV examples
  if (cat.includes('document') || cat.includes('pdf') || cat.includes('spreadsheet') || cat.includes('csv')) {
    return [
      { label: 'Structured JSON Data Extraction', prompt: 'Extract key entities (names, dates, amounts, invoice numbers, line items) from this document into clean structured JSON.' },
      { label: 'Executive Summary & Risk Analysis', prompt: 'Provide a concise 1-page executive summary highlighting key findings, metrics, and critical risk flags.' },
      { label: 'Table to Insights Synthesis', prompt: 'Analyze this spreadsheet data and generate 4 high-level strategic takeaways and trend observations.' },
      { label: 'Action Item Matrix with Deadlines', prompt: 'Parse this document and list all deliverables, owners, and expected due dates in a clean table.' }
    ];
  }

  // Generic Fallback
  return [
    { label: 'High-Impact Copy & Hooks', prompt: `Analyze the provided media and synthesize high-converting copy matching a ${tone} brand voice.` },
    { label: 'Key Highlights & Takeaways', prompt: 'Extract the top 3 critical takeaways and structure them into clear, actionable bullet points.' },
    { label: 'Engagement Hook with Hashtags', prompt: 'Generate 3 viral opening lines and 10 relevant hashtags to maximize reach and retention.' },
    { label: 'Structured Downstream Summary', prompt: 'Deliver a clean structured summary ready to pass directly to downstream workflow actions.' }
  ];
}

export function executeVisionPromptDrafter({ brandTone = 'engaging', mediaType = 'video', taskOperation = 'generate_caption', userPrompt = '' }) {
  let baseIntent = '';
  
  if (userPrompt && userPrompt.trim()) {
    baseIntent = userPrompt.trim();
  } else if (taskOperation.includes('caption') || taskOperation.includes('hashtag')) {
    baseIntent = `Generate 3 viral high-converting captions, emotional hooks, and 15 targeted hashtags for social media.`;
  } else if (taskOperation.includes('transcription')) {
    baseIntent = `Transcribe the audio stream with clean punctuation, timestamps, and speaker identification.`;
  } else if (taskOperation.includes('summary')) {
    baseIntent = `Perform multimodal semantic analysis and output a 3-bullet executive summary and key takeaways.`;
  } else {
    baseIntent = `Process the input ${mediaType} and deliver structured downstream workflow variables.`;
  }

  const synthesizedPrompt = `You are the AI Radahn Vision & Multimodal Encoder.
Target Media Asset: [${mediaType.toUpperCase()}]
Brand Persona & Tone: [${brandTone.toUpperCase()}]

Objective & Custom Instructions:
${baseIntent}

Execution Directives:
1. Examine the visual, textual, or auditory elements in the input media asset carefully.
2. Structure the output clearly with high-impact readability, engaging formatting, and relevant emojis where appropriate.
3. Ensure the response is directly usable by downstream workflow actions (e.g. Google Sheets, Instagram DM, Email, Slack).`;

  return {
    generatedInstruction: synthesizedPrompt,
    customPrompt: synthesizedPrompt,
    prompt: synthesizedPrompt,
    body: synthesizedPrompt,
    suggestedTemperature: 0.2,
    suggestedModel: 'gemini-1.5-flash'
  };
}

// ==========================================
// 7. TRANSACTIONAL EMAIL TEMPLATE ARCHITECT
// ==========================================
export function executeTemplateArchitect({ instruction = '', tone = 'modern_dark', currentTemplate = '' }) {
  const promptLower = (instruction || '').toLowerCase();
  
  // If this is an iterative refinement on an existing template, try surgical refinement first
  if (currentTemplate && (currentTemplate.includes('<html') || currentTemplate.includes('container')) && (promptLower.includes('refinement') || promptLower.includes('change') || promptLower.includes('remove') || promptLower.includes('tweak') || promptLower.includes('make') || promptLower.includes('use'))) {
    const refined = refineEmailTemplateHtml(currentTemplate, instruction);
    if (refined && refined !== currentTemplate) {
      return { template: refined };
    }
  }

  const theme = resolveDesignTheme(instruction, tone);
  const isPasswordReset = promptLower.includes('reset') || promptLower.includes('password') || !promptLower.includes('setup');
  const copyData = compileCopyFramework({ prompt: instruction, isPasswordReset, themeTokens: theme });

  // Negative element removals
  const hasNoEyebrow = promptLower.includes('remove eyebrow') || 
                       promptLower.includes('no eyebrow') || 
                       promptLower.includes('without eyebrow') || 
                       promptLower.includes('hide eyebrow') || 
                       promptLower.includes('remove the eyebrow') ||
                       promptLower.includes('remove badge') ||
                       promptLower.includes('no badge') ||
                       promptLower.includes('without badge');

  const hasNoLogo = promptLower.includes('remove logo') || promptLower.includes('no logo') || promptLower.includes('without logo');
  const hasNoExpiry = promptLower.includes('remove expiry') || promptLower.includes('no expiry') || promptLower.includes('remove security notice') || promptLower.includes('no security notice') || promptLower.includes('without security notice') || promptLower.includes('no disclaimer');
  const hasNoFooter = promptLower.includes('remove footer') || promptLower.includes('no footer');

  // Dynamic Eyebrow Badge Text
  let badgeText = copyData.badgeLabel || theme.badgeText;
  if (!hasNoEyebrow && (promptLower.includes('eyebrow') || promptLower.includes('badge'))) {
    if (promptLower.includes('system') || promptLower.includes('other relevant text') || promptLower.includes('workflow') || promptLower.includes('cloud')) {
      badgeText = 'AUTOMATIX SYSTEM IDENTITY GUARD';
    } else if (promptLower.includes('security') || promptLower.includes('notice')) {
      badgeText = 'ENTERPRISE SECURITY VERIFICATION';
    } else if (promptLower.includes('access') || promptLower.includes('auth')) {
      badgeText = 'TENANT ACCESS AUTHORIZATION';
    }
  }

  // Dynamic User Name Detection
  const hasUserName = promptLower.includes('user name') || promptLower.includes('username') || promptLower.includes('name variable') || promptLower.includes('salutation') || promptLower.includes('greeting') || promptLower.includes('cute') || promptLower.includes('gorgeous');
  const is24h = promptLower.includes('24') || promptLower.includes('hour') || promptLower.includes('expir') || promptLower.includes('urgent') || promptLower.includes('disclaimer');

  const headline = copyData.headline;
  const buttonLabel = copyData.buttonLabel;

  const salutationHtml = hasUserName 
    ? `<div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 8px; text-align: left;">${copyData.salutation}</div>`
    : '';

  const textAlignBody = hasUserName ? 'text-align: left;' : 'text-align: center;';
  const introText = copyData.bodyIntro;

  const expiryBox = (hasNoExpiry || (!is24h && !isPasswordReset))
    ? ''
    : `
      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 14px 18px; margin: 28px 0; text-align: left;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${theme.tagColor}; margin-bottom: 4px;">Security Notice</div>
        <div style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
          This secure link is time-sensitive and will expire in <strong>24 hours</strong>. If you did not initiate this request, no further action is required and your account remains protected.
        </div>
      </div>`;

  const eyebrowMarkup = hasNoEyebrow ? '' : `<div class="brand-badge">${badgeText}</div>`;
  const logoMarkup = hasNoLogo ? '' : renderBrandLogoSvg();
  const footerMarkup = hasNoFooter ? '' : `
      <div class="footer">
        &copy; ${new Date().getFullYear()} Automatix Inc. High-Performance Workflow Automation.<br/>
        Dispatched to <span style="color: #a1a1aa;">{{USER_EMAIL}}</span>.
      </div>`;

  const generatedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline} - Automatix</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      font-family: ${theme.fontFamily};
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #050505;
      padding: 40px 16px;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: ${theme.cardBg};
      border: 1px solid ${theme.cardBorder};
      border-radius: 16px;
      padding: 36px 32px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .brand-badge {
      display: inline-block;
      padding: 4px 14px;
      background-color: ${theme.badgeBg};
      border: 1px solid ${theme.accentBorder};
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${theme.tagColor};
      margin-bottom: 20px;
      box-shadow: ${theme.eyebrowGlow};
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0 0 16px 0;
    }
    .description {
      font-size: 14px;
      color: #a1a1aa;
      line-height: 1.65;
      margin: 0 0 24px 0;
      ${textAlignBody}
    }
    .btn-container {
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: ${theme.gradientBg};
      color: ${theme.textColorOnBtn} !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: ${copyData.buttonRadius || '10px'};
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.01em;
      box-shadow: ${theme.buttonShadow};
      transition: all 0.2s ease;
    }
    .alt-link {
      font-size: 12px;
      color: #71717a;
      line-height: 1.6;
      word-break: break-all;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: left;
    }
    .alt-link a {
      color: ${theme.tagColor};
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #52525b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${eyebrowMarkup}
      
      ${logoMarkup}
      
      <h1 class="title">${headline}</h1>
      
      ${salutationHtml}

      <p class="description">
        ${introText}
      </p>

      <div class="btn-container">
        <a href="{{SETUP_LINK}}" class="btn" target="_blank">${buttonLabel}</a>
      </div>

      ${expiryBox}

      <div class="alt-link">
        Button not working? Paste this link into your browser:<br/>
        <a href="{{SETUP_LINK}}">{{SETUP_LINK}}</a>
      </div>

      ${footerMarkup}
    </div>
  </div>
</body>
</html>`;

  return {
    template: generatedHtml
  };
}

// ==========================================
// 8. BROADCAST ANNOUNCEMENT ARCHITECT
// ==========================================
export function executeAnnouncementArchitect({ selectedDeployments = [], customNotes = '', tone = 'feature_release' }) {
  const isSecurity = tone === 'security_compliance';
  const isPerf = tone === 'performance_update';
  const isExec = tone === 'executive_summary';

  let subject = 'Major Platform Updates: Multimodal AI Mediator, Cloud Storage Triggers & 60fps Engine';
  if (isSecurity) subject = 'Security & Reliability Notice: Hardened Access Protocols & Upgraded Cloud Engine';
  else if (isPerf) subject = 'Performance Boost: 60fps Low-Latency Execution & Hardware Acceleration';
  else if (isExec) subject = 'Executive Product Changelog: Latest Enterprise Features & Workflow Upgrades';

  const bullets = selectedDeployments.length > 0
    ? selectedDeployments.map(d => {
        const text = typeof d === 'string' ? d : d.message;
        const parts = text.split(':');
        const title = parts.length > 1 ? parts[0].trim() : 'System Enhancement';
        const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : text;
        return `  <li><strong>${title}:</strong> ${desc}</li>`;
      }).join('\n')
    : `  <li><strong>Multimodal AI Mediator:</strong> Automated visual captioning, speech-to-text, and data extraction across files.</li>
  <li><strong>High-Speed Cloud Sync:</strong> Direct Google Drive and cloud storage trigger support.</li>
  <li><strong>60fps Canvas Engine:</strong> Low-latency hardware acceleration for smooth workflow creation.</li>`;

  const htmlBody = `<p>Hello {{USER_NAME}},</p>
<p>${customNotes ? customNotes : 'We are pleased to introduce the latest system enhancements and feature upgrades on Automatix.'}</p>

<h3>${isSecurity ? 'Security & Reliability Updates:' : isPerf ? 'Speed & Engine Optimizations:' : isExec ? 'Product Changelog Overview:' : 'What is New Today:'}</h3>
<ul>
${bullets}
</ul>

<p>All updates are live on your account now. Explore the latest nodes and triggers directly in your dashboard!</p>`;

  return {
    subject,
    body: htmlBody
  };
}

// ==========================================
// 9. BROADCAST REFINE ARCHITECT
// ==========================================
export function executeRefineArchitect({ instruction = '', subject = '', body = '' }) {
  const inst = (instruction || '').toLowerCase();

  let modifiedSubject = subject || 'Automatix System Announcement';
  let modifiedBody = body || '<p>Hello {{USER_NAME}},</p><p>Here are your latest platform updates.</p>';

  if (inst.includes('concise') || inst.includes('short') || inst.includes('punchy')) {
    modifiedSubject = modifiedSubject.replace(/^(Major Platform Updates:|Important:)/i, '').trim();
    modifiedSubject = `Quick Update: ${modifiedSubject}`;
  } else if (inst.includes('executive') || inst.includes('professional')) {
    modifiedSubject = `Executive Briefing: ${modifiedSubject}`;
  } else if (inst.includes('speed') || inst.includes('performance')) {
    modifiedSubject = `Performance Release: 60fps Acceleration & Engine Upgrades`;
  }

  if (inst.includes('cta') || inst.includes('call to action') || inst.includes('button')) {
    if (!modifiedBody.includes('Open Dashboard')) {
      modifiedBody += `\n<p style="margin-top: 20px;"><a href="{{APP_URL}}" style="display:inline-block; background-color:#8B5CF6; color:#ffffff; padding:10px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">Open Dashboard &rarr;</a></p>`;
    }
  }

  return {
    subject: modifiedSubject,
    body: modifiedBody
  };
}
