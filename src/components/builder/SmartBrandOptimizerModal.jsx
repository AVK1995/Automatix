'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Palette, 
  Wand2, 
  Type, 
  Layers, 
  RefreshCw, 
  Sun, 
  Moon,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GOOGLE_FONTS_CATALOG, CALENDAR_THEMES } from '@/utils/calendarThemes';

export default function SmartBrandOptimizerModal({ 
  calendar, 
  onApply, 
  onClose 
}) {
  const [logoUrl, setLogoUrl] = useState(calendar.logoUrl || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState({
    themeColor: calendar.themeColor || '#3B82F6',
    bgTheme: calendar.bgTheme || 'obsidian',
    fontFamily: calendar.fontFamily || 'Plus Jakarta Sans',
    buttonStyle: calendar.buttonStyle || 'rounded',
    detectedPalette: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4']
  });

  // Client-side image color extraction
  const analyzeLogo = (url) => {
    if (!url) return;
    setAnalyzing(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);
        
        const imgData = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts = {};
        let totalBrightness = 0;
        let validPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Ignore transparent or near-black/near-white backgrounds
          if (a < 128) continue;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;

          totalBrightness += brightness;
          validPixels++;

          // Quantize color into hex
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1).toUpperCase()}`;

          // Prioritize saturated colors
          const weight = 1 + (saturation * 3);
          colorCounts[hex] = (colorCounts[hex] || 0) + weight;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex);

        const primaryColor = sortedColors.find(c => c !== '#000000' && c !== '#FFFFFF') || sortedColors[0] || '#3B82F6';
        const avgBrightness = validPixels > 0 ? totalBrightness / validPixels : 128;
        
        // Recommend background based on brand tone
        const recommendedBg = avgBrightness > 190 ? 'light' : 'obsidian';
        
        // Match font vibe
        const nameKeywords = (calendar.name || '').toLowerCase();
        let recommendedFont = 'Plus Jakarta Sans';
        if (nameKeywords.includes('consult') || nameKeywords.includes('law') || nameKeywords.includes('finance') || nameKeywords.includes('vip')) {
          recommendedFont = 'Playfair Display';
        } else if (nameKeywords.includes('tech') || nameKeywords.includes('dev') || nameKeywords.includes('code') || nameKeywords.includes('crypto')) {
          recommendedFont = 'Space Grotesk';
        } else if (nameKeywords.includes('agency') || nameKeywords.includes('creative') || nameKeywords.includes('design')) {
          recommendedFont = 'Outfit';
        } else if (nameKeywords.includes('discovery') || nameKeywords.includes('demo') || nameKeywords.includes('sales')) {
          recommendedFont = 'Inter';
        }

        setSuggestion({
          themeColor: primaryColor,
          bgTheme: recommendedBg,
          fontFamily: recommendedFont,
          buttonStyle: primaryColor === '#FFFFFF' ? 'sharp' : 'rounded',
          detectedPalette: sortedColors.slice(0, 6)
        });
      } catch (err) {
        // Fallback heuristic
        setSuggestion(prev => ({
          ...prev,
          themeColor: '#3B82F6',
          detectedPalette: ['#3B82F6', '#8B5CF6', '#10B981', '#F43F5E']
        }));
      } finally {
        setAnalyzing(false);
      }
    };

    img.onerror = () => {
      setAnalyzing(false);
      toast.error('Unable to load image for analysis. You can pick colors manually.');
    };
  };

  useEffect(() => {
    if (logoUrl) {
      analyzeLogo(logoUrl);
    }
  }, []);

  const handleApply = () => {
    onApply(suggestion);
    toast.success('✨ Smart Brand Theme Applied!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-accent-blue/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-inner">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Smart Calendar UI Optimizer</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI Brand Analyzer
                </span>
              </div>
              <p className="text-xs text-text-secondary">Automatically extracts brand colors, matches fonts & optimizes your calendar theme.</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          
          {/* Logo Input Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white">Brand Logo URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://your-website.com/logo.png"
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              />
              <button
                type="button"
                onClick={() => analyzeLogo(logoUrl)}
                disabled={analyzing || !logoUrl}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-accent-blue" />}
                Analyze Brand
              </button>
            </div>
            {logoUrl && (
              <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="max-h-12 max-w-[120px] object-contain rounded bg-black/30 p-1 border border-white/10" 
                  onError={(e) => e.target.style.display='none'}
                />
                <div className="text-xs">
                  <span className="text-white font-medium block">Logo Connected</span>
                  <span className="text-text-tertiary text-[11px]">Ready for palette extraction & tone matching</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Recommended Optimization Breakdown */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
              Generated Brand Profile
            </h4>

            {/* Detected Color Palette */}
            {suggestion.detectedPalette?.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Detected Brand Colors (Click to set as primary)</label>
                <div className="flex flex-wrap gap-2.5">
                  {suggestion.detectedPalette.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSuggestion({ ...suggestion, themeColor: col })}
                      className={`w-9 h-9 rounded-xl transition-all border flex items-center justify-center ${
                        suggestion.themeColor === col
                          ? 'scale-110 border-white ring-2 ring-white/40 shadow-lg' 
                          : 'border-white/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                      title={col}
                    >
                      {suggestion.themeColor === col && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Pillars Breakdown: Theme Tone + Font + Shape */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Background Theme */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Background Tone</span>
                <div className="flex items-center gap-2">
                  {suggestion.bgTheme === 'light' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-accent-blue" />
                  )}
                  <span className="text-xs font-bold text-white capitalize">
                    {CALENDAR_THEMES.find(t => t.id === suggestion.bgTheme)?.name || 'Dark Obsidian'}
                  </span>
                </div>
              </div>

              {/* Matched Font */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Matched Google Font</span>
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white truncate">
                    {suggestion.fontFamily}
                  </span>
                </div>
              </div>

              {/* Button Shape */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-text-tertiary block">Button Shape</span>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white capitalize">
                    {suggestion.buttonStyle} Corners
                  </span>
                </div>
              </div>

            </div>

            {/* Live Interactive Simulation Card */}
            <div className="p-4 rounded-xl border border-white/10 space-y-3 relative overflow-hidden transition-all"
              style={{
                backgroundColor: suggestion.bgTheme === 'light' ? '#f4f5f7' : '#0e0e0e'
              }}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ backgroundColor: suggestion.themeColor }}
              />
              <div className="flex items-center justify-between pt-1">
                <span 
                  className="font-bold text-sm truncate max-w-[200px]"
                  style={{ 
                    color: suggestion.bgTheme === 'light' ? '#09090b' : '#ffffff',
                    fontFamily: `${suggestion.fontFamily}, sans-serif`
                  }}
                >
                  {calendar.name || 'Your Consultation Meeting'}
                </span>
                <span 
                  className="px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
                  style={{ 
                    backgroundColor: suggestion.themeColor,
                    borderRadius: suggestion.buttonStyle === 'sharp' ? '2px' : suggestion.buttonStyle === 'pill' ? '9999px' : '6px'
                  }}
                >
                  Aug 28
                </span>
              </div>
              <div className="flex gap-2">
                <div 
                  className="flex-1 py-2 text-center text-xs font-semibold shadow-sm text-white transition-all"
                  style={{ 
                    backgroundColor: suggestion.themeColor,
                    borderRadius: suggestion.buttonStyle === 'sharp' ? '2px' : suggestion.buttonStyle === 'pill' ? '9999px' : '6px',
                    fontFamily: `${suggestion.fontFamily}, sans-serif`
                  }}
                >
                  10:00 AM (Confirmed)
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-lg shadow-accent-blue/20"
          >
            <Check className="w-4 h-4" />
            Apply Smart Optimized Theme
          </button>
        </div>

      </div>
    </div>
  );
}
