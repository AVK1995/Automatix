// Google Fonts Catalog and Theme Tone Definitions for Automatix Calendars

export const GOOGLE_FONTS_CATALOG = [
  { name: 'Plus Jakarta Sans', category: 'Modern Tech Sans (Default)', importUrl: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { name: 'Inter', category: 'Neutral UI Sans', importUrl: 'Inter:wght@400;500;600;700' },
  { name: 'Outfit', category: 'Modern Geometric Sans', importUrl: 'Outfit:wght@400;500;600;700;800' },
  { name: 'DM Sans', category: 'Geometric Modern', importUrl: 'DM+Sans:wght@400;500;700' },
  { name: 'Poppins', category: 'Rounded Geometric', importUrl: 'Poppins:wght@400;500;600;700' },
  { name: 'Montserrat', category: 'Architectural Clean', importUrl: 'Montserrat:wght@400;500;600;700;800' },
  { name: 'Roboto', category: 'Clean Neutral', importUrl: 'Roboto:wght@400;500;700' },
  { name: 'Open Sans', category: 'Friendly Sans', importUrl: 'Open+Sans:wght@400;600;700' },
  { name: 'Lato', category: 'Warm Sans', importUrl: 'Lato:wght@400;700' },
  { name: 'Space Grotesk', category: 'Tech & Web3 Grotesk', importUrl: 'Space+Grotesk:wght@400;500;600;700' },
  { name: 'Sora', category: 'Digital Precision', importUrl: 'Sora:wght@400;600;700' },
  { name: 'Manrope', category: 'Executive Enterprise', importUrl: 'Manrope:wght@400;500;600;700;800' },
  { name: 'Playfair Display', category: 'High-End Luxury Serif', importUrl: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Cinzel', category: 'Classical Classical Serif', importUrl: 'Cinzel:wght@400;600;700;800' },
  { name: 'Lora', category: 'Warm Editorial Serif', importUrl: 'Lora:ital,wght@0,400;0,600;0,700;1,400' },
  { name: 'Merriweather', category: 'Classic Book Serif', importUrl: 'Merriweather:ital,wght@0,400;0,700;1,400' },
  { name: 'JetBrains Mono', category: 'Developer Monospace', importUrl: 'JetBrains+Mono:wght@400;500;600;700' },
  { name: 'Syne', category: 'Creative Studio Display', importUrl: 'Syne:wght@500;600;700;800' },
];

export const CALENDAR_THEMES = [
  {
    id: 'obsidian',
    name: 'Dark Obsidian (Default)',
    description: 'Sleek deep dark theme with pure blacks and high-contrast text',
    bg: '#0a0a0a',
    card: '#111111',
    sidebar: '#0e0e0e',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: 'rgba(255,255,255,0.1)',
    isDark: true
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    description: 'Rich dark blue-gray navy tone for executive tech brands',
    bg: '#0b0f19',
    card: '#111827',
    sidebar: '#0f172a',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.12)',
    isDark: true
  },
  {
    id: 'zinc',
    name: 'Zinc Charcoal',
    description: 'Modern neutral charcoal with crisp borders',
    bg: '#18181b',
    card: '#27272a',
    sidebar: '#1f1f23',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: 'rgba(255,255,255,0.15)',
    isDark: true
  },
  {
    id: 'light',
    name: 'Clean Modern Light',
    description: 'Crisp, minimalist white & soft gray theme for light websites',
    bg: '#f4f5f7',
    card: '#ffffff',
    sidebar: '#f8fafc',
    text: '#09090b',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    border: '#e4e4e7',
    isDark: false
  },
  {
    id: 'warm_cream',
    name: 'Warm Minimalist Cream',
    description: 'Editorial warm stone & soft linen cream aesthetic',
    bg: '#f7f4ed',
    card: '#ffffff',
    sidebar: '#fdfbf7',
    text: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#a8a29e',
    border: '#e7e5e4',
    isDark: false
  },
  {
    id: 'custom',
    name: 'Custom Brand Palette',
    description: 'Pick custom page background, card container, and text colors',
    bg: null,
    card: null,
    sidebar: null,
    text: null,
    border: null,
    isDark: true
  }
];

export function getResolvedTheme(calendar = {}) {
  const themeId = calendar.bgTheme || 'obsidian';
  const base = CALENDAR_THEMES.find(t => t.id === themeId) || CALENDAR_THEMES[0];

  if (themeId === 'custom') {
    return {
      id: 'custom',
      name: 'Custom Brand Palette',
      bg: calendar.customBgColor || '#0a0a0a',
      card: calendar.customCardColor || '#111111',
      sidebar: calendar.customCardColor ? `${calendar.customCardColor}cc` : '#0e0e0e',
      text: calendar.customTextColor || '#ffffff',
      textSecondary: calendar.customTextColor ? `${calendar.customTextColor}99` : '#a1a1aa',
      textMuted: calendar.customTextColor ? `${calendar.customTextColor}66` : '#71717a',
      border: 'rgba(255,255,255,0.12)',
      isDark: true
    };
  }

  return base;
}
