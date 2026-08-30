/**
 * AI Radahn Autonomous Web Discovery, Color Harmonics & Copywriting Framework Engine
 * Performs real-time design synthesis and semantic palette extraction.
 */

// ==========================================
// 1. COLOR HARMONICS & HSL MATHEMATICAL MATRIX
// ==========================================
export function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Generate high-converting dark-theme token matrix from any base color
export function generateThemeMatrixFromBase(baseHex, { isWarm = false, isPastel = false, isSharp = false, themeName = 'Custom' } = {}) {
  const hsl = hexToHsl(baseHex);

  // Derive secondary (analogous +30deg or +45deg)
  const secH = (hsl.h + (isWarm ? 35 : 45)) % 360;
  const secS = isPastel ? Math.max(hsl.s - 20, 50) : Math.min(hsl.s + 10, 95);
  const secL = isPastel ? Math.min(hsl.l + 15, 80) : Math.max(hsl.l - 15, 30);
  const secondaryColor = hslToHex(secH, secS, secL);

  // Derive accent (complementary +180deg)
  const accH = (hsl.h + 180) % 360;
  const accentColor = hslToHex(accH, Math.min(hsl.s + 15, 100), isPastel ? 75 : 55);

  // Derive card background (deep obsidian tinted with the base hue)
  const cardBg = hslToHex(hsl.h, Math.min(hsl.s, 25), 4);
  const cardBorder = `rgba(${parseInt(baseHex.slice(1,3),16)}, ${parseInt(baseHex.slice(3,5),16)}, ${parseInt(baseHex.slice(5,7),16)}, 0.22)`;
  const buttonShadow = `0 10px 28px rgba(${parseInt(baseHex.slice(1,3),16)}, ${parseInt(baseHex.slice(3,5),16)}, ${parseInt(baseHex.slice(5,7),16)}, ${isPastel ? 0.3 : 0.45})`;

  return {
    themeName,
    primaryColor: baseHex,
    secondaryColor,
    accentColor,
    gradientBg: `linear-gradient(135deg, ${baseHex} 0%, ${secondaryColor} 100%)`,
    buttonShadow,
    accentBorder: cardBorder,
    tagColor: isPastel ? baseHex : accentColor,
    badgeBg: `rgba(${parseInt(baseHex.slice(1,3),16)}, ${parseInt(baseHex.slice(3,5),16)}, ${parseInt(baseHex.slice(5,7),16)}, 0.1)`,
    textColorOnBtn: hsl.l > 65 || isPastel ? '#09090b' : '#ffffff',
    cardBg,
    cardBorder,
    badgeText: 'SYSTEM IDENTITY AUTHORIZED',
    fontFamily: isSharp ? "'Space Grotesk', -apple-system, sans-serif" : isPastel ? "'Outfit', 'Plus Jakarta Sans', sans-serif" : "'Plus Jakarta Sans', -apple-system, sans-serif",
    eyebrowGlow: `0 0 14px rgba(${parseInt(baseHex.slice(1,3),16)}, ${parseInt(baseHex.slice(3,5),16)}, ${parseInt(baseHex.slice(5,7),16)}, 0.35)`
  };
}

// ==========================================
// 2. AUTONOMOUS WEB DISCOVERY & ENTITY MINER
// ==========================================
const CURATED_ENTITY_MAP = {
  // Brands & Gaming
  'cyberpunk': { hex: '#FCEE0A', isSharp: true, name: 'Cyberpunk High-Tech' },
  'synthwave': { hex: '#FF007F', isWarm: true, name: 'Retro Synthwave' },
  'vice': { hex: '#FF007F', isWarm: true, name: 'Retro Sunset Synthwave' },
  'tactical': { hex: '#84CC16', isSharp: true, name: 'Tactical Military Stealth' },
  'camo': { hex: '#84CC16', isSharp: true, name: 'Tactical Military Stealth' },
  'military': { hex: '#84CC16', isSharp: true, name: 'Tactical Military Stealth' },
  'stealth': { hex: '#84CC16', isSharp: true, name: 'Tactical Military Stealth' },
  'crimson': { hex: '#FF4655', isSharp: true, name: 'Hyper FPS Crimson' },
  'valorant': { hex: '#FF4655', isSharp: true, name: 'Hyper FPS Crimson' },
  'spotify': { hex: '#1DB954', name: 'Emerald Wave Sound' },
  'ferrari': { hex: '#FF2800', isSharp: true, name: 'Rosso Corsa Supercar' },
  'porsche': { hex: '#D4AF37', isWarm: true, name: 'Stuttgart Titanium Gold' },
  'apple': { hex: '#F8FAFC', name: 'Minimalist Platinum' },
  'matcha': { hex: '#65A30D', isPastel: true, name: 'Kyoto Organic Matcha' },
  'tokyo': { hex: '#EC4899', isPastel: true, name: 'Neo-Tokyo Blossom' },
  'lavender': { hex: '#A855F7', isPastel: true, name: 'Pastel Dream Lavender' },
  'ocean': { hex: '#0284C7', name: 'Deep Pacific Ocean' },
  'sunset': { hex: '#F97316', isWarm: true, name: 'Golden Hour Sunset' },
  'luxury': { hex: '#F59E0B', isWarm: true, name: 'VIP Executive Obsidian' },
  'gold': { hex: '#F59E0B', isWarm: true, name: 'VIP Executive Obsidian' },
  'emerald': { hex: '#10B981', name: 'Enterprise Emerald Shield' },
  'mint': { hex: '#10B981', isPastel: true, name: 'Fresh Mint Clean' },
  'cyan': { hex: '#00E5FF', isSharp: true, name: 'Cyber Glow & Neon Cyan' },
  'electric blue': { hex: '#0072FF', isSharp: true, name: 'Electric Hyper Blue' }
};

export async function discoverDesignTokens(prompt = '') {
  const p = (prompt || '').toLowerCase();
  
  // Modifiers detection
  const isCute = p.includes('cute') || p.includes('gorgeous') || p.includes('charming') || p.includes('sweet') || p.includes('delightful') || p.includes('soft') || p.includes('pastel');
  const isSharp = p.includes('sharp') || p.includes('tactical') || p.includes('stealth') || p.includes('combat') || p.includes('cyber') || p.includes('tech') || p.includes('code');
  const isLuxury = p.includes('luxury') || p.includes('vip') || p.includes('executive') || p.includes('royal') || p.includes('prestige') || p.includes('gold');
  const isUrgent = p.includes('urgent') || p.includes('critical') || p.includes('alert') || p.includes('security') || p.includes('warning');

  // Match known entities
  for (const [key, entity] of Object.entries(CURATED_ENTITY_MAP)) {
    if (p.includes(key)) {
      return generateThemeMatrixFromBase(entity.hex, {
        isWarm: entity.isWarm || isLuxury,
        isPastel: isCute || entity.isPastel,
        isSharp: isSharp || entity.isSharp,
        themeName: entity.name
      });
    }
  }

  // Handle color mentions directly in prompt
  if (p.includes('pink') || p.includes('magenta') || p.includes('rose')) {
    const baseHex = isCute ? '#FF66C4' : '#E11D48';
    return generateThemeMatrixFromBase(baseHex, { isPastel: isCute, isWarm: true, themeName: isCute ? 'Cute Pastel Rose' : 'Velvet Magenta' });
  }
  if (p.includes('purple') || p.includes('violet')) {
    const baseHex = isCute ? '#B28DFF' : '#8B5CF6';
    return generateThemeMatrixFromBase(baseHex, { isPastel: isCute, themeName: isCute ? 'Soft Lavender Dream' : 'Modern Royal Violet' });
  }
  if (p.includes('blue') || p.includes('neon blue') || p.includes('cyan')) {
    const baseHex = isSharp ? '#00E5FF' : '#3B82F6';
    return generateThemeMatrixFromBase(baseHex, { isSharp, themeName: 'Electric Cyber Blue' });
  }
  if (p.includes('green') || p.includes('lime')) {
    const baseHex = isSharp ? '#84CC16' : '#10B981';
    return generateThemeMatrixFromBase(baseHex, { isSharp, themeName: 'Tactical Lime Emerald' });
  }
  if (p.includes('orange') || p.includes('amber') || p.includes('yellow')) {
    const baseHex = p.includes('yellow') ? '#FCEE0A' : '#F97316';
    return generateThemeMatrixFromBase(baseHex, { isWarm: true, themeName: 'High-Energy Amber' });
  }
  if (p.includes('white') || p.includes('minimal') || p.includes('clean')) {
    return generateThemeMatrixFromBase('#FFFFFF', { themeName: 'Clean Minimalist Monochrome' });
  }

  // Default: Dynamic calculation from prompt sentiment
  if (isCute) {
    return generateThemeMatrixFromBase('#FF70A6', { isPastel: true, isWarm: true, themeName: 'Pastel Dreamscape' });
  }
  if (isLuxury) {
    return generateThemeMatrixFromBase('#F59E0B', { isWarm: true, themeName: 'VIP Executive Obsidian' });
  }
  if (isUrgent) {
    return generateThemeMatrixFromBase('#EF4444', { isSharp: true, themeName: 'High-Priority Security Protocol' });
  }

  // Default Modern Dark Violet
  return generateThemeMatrixFromBase('#8B5CF6', { themeName: 'Modern Dark Obsidian' });
}

// ==========================================
// 3. CONVERSION COPYWRITING FRAMEWORKS
// ==========================================
export function compileCopyFramework({ prompt = '', isPasswordReset = true, themeTokens = {} }) {
  const p = (prompt || '').toLowerCase();
  
  const isCute = p.includes('cute') || p.includes('gorgeous') || p.includes('delightful') || p.includes('sweet') || p.includes('soft');
  const isUrgent = p.includes('urgent') || p.includes('expire') || p.includes('warning') || p.includes('security') || p.includes('critical');
  const isExecutive = p.includes('executive') || p.includes('luxury') || p.includes('vip') || p.includes('advisory');
  const isTactical = p.includes('tactical') || p.includes('stealth') || p.includes('mission') || p.includes('camo') || p.includes('military');

  let salutation = 'Hello {{USER_NAME}},';
  let headline = isPasswordReset ? 'Reset Your Password' : 'Set Up Your Automatix Account';
  let bodyIntro = '';
  let buttonLabel = isPasswordReset ? 'Reset Password' : 'Set Up Password & Access';
  let badgeLabel = themeTokens.badgeText || 'AUTOMATIX SECURE CLOUD';
  let buttonRadius = '10px';

  // 1. Cute / Charming / Delightful
  if (isCute) {
    headline = isPasswordReset ? 'Password Reset For You ✨' : 'Welcome to Your Gorgeous Workspace 🌸';
    salutation = 'Hello {{USER_NAME}}! 💕';
    bodyIntro = isPasswordReset
      ? 'We received a request to update the password for your Automatix account (<strong>{{USER_EMAIL}}</strong>). Click the lovely button below to get back in seamlessly.'
      : 'Your brand new Automatix workspace has been beautifully prepared for <strong>{{USER_EMAIL}}</strong>. Click below to initialize your journey!';
    buttonLabel = isPasswordReset ? 'Reset My Password ✨' : 'Enter My Workspace 🌸';
    badgeLabel = 'DELIGHTFUL WORKSPACE ACCESS';
    buttonRadius = '9999px'; // full pill for cute
  } 
  // 2. Urgent / PAS (Problem - Agitate - Solve)
  else if (isUrgent) {
    headline = isPasswordReset ? 'Action Required: Reset Password' : 'Time-Sensitive Account Setup';
    salutation = 'Hello {{USER_NAME}},';
    bodyIntro = isPasswordReset
      ? 'A password change request was triggered for <strong>{{USER_EMAIL}}</strong>. To safeguard your account security and uninterrupted automation flows, update your credentials below.'
      : 'Your enterprise tenant account is awaiting credential configuration for <strong>{{USER_EMAIL}}</strong>. Activate your seat before expiry.';
    buttonLabel = isPasswordReset ? 'Authorize Password Reset' : 'Verify & Set Up Account';
    badgeLabel = 'HIGH-PRIORITY SECURITY ACTION';
    buttonRadius = '8px';
  }
  // 3. Executive / Luxury
  else if (isExecutive) {
    headline = isPasswordReset ? 'Executive Credential Authorization' : 'Welcome to Automatix Executive Suite';
    salutation = 'Dear {{USER_NAME}},';
    bodyIntro = isPasswordReset
      ? 'An authentication update has been requested for your executive account associated with <strong>{{USER_EMAIL}}</strong>. Please proceed with identity verification below.'
      : 'Your tenant credentials have been provisioned for <strong>{{USER_EMAIL}}</strong>. You are invited to access your high-performance automation suite.';
    buttonLabel = isPasswordReset ? 'Authorize Access Update' : 'Initialize Executive Seat';
    badgeLabel = 'EXECUTIVE CONCIERGE PROTOCOL';
    buttonRadius = '10px';
  }
  // 4. Tactical Stealth
  else if (isTactical) {
    headline = isPasswordReset ? 'Operational Access Clearance' : 'Tenant Deployment Initialized';
    salutation = 'Operator {{USER_NAME}},';
    bodyIntro = isPasswordReset
      ? 'Authentication override request received for <strong>{{USER_EMAIL}}</strong>. Engage the secure clearance button below to verify credentials.'
      : 'Deployment complete for operator <strong>{{USER_EMAIL}}</strong>. Connect your workstation to begin automated pipeline operations.';
    buttonLabel = isPasswordReset ? 'Authorize Clearance' : 'Deploy Credentials & Access';
    badgeLabel = 'TACTICAL OPERATIONAL CLEARANCE';
    buttonRadius = '6px';
  }
  // 5. Modern Clean Standard
  else {
    bodyIntro = isPasswordReset
      ? 'We received a request to configure or reset the password for your Automatix account associated with <strong>{{USER_EMAIL}}</strong>.<br/><br/>Click the secure action button below to proceed with your authentication update.'
      : 'Your Automatix account has been successfully provisioned for <strong>{{USER_EMAIL}}</strong>.<br/><br/>Click the button below to initialize your credentials and access your workflow dashboard.';
  }

  return {
    headline,
    salutation,
    bodyIntro,
    buttonLabel,
    badgeLabel,
    buttonRadius
  };
}
