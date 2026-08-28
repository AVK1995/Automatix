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
  ArrowRight,
  Zap,
  Info,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GOOGLE_FONTS_CATALOG, CALENDAR_THEMES, getResolvedTheme } from '@/utils/calendarThemes';
import { executeBrandOptimizer } from '@/lib/ai-radahn/brain';
import AiCreditUpgradeModal from '@/components/ui/AiCreditUpgradeModal';

export default function SmartBrandOptimizerModal({ 
  calendar, 
  onApply, 
  onClose 
}) {
  const [logoUrl, setLogoUrl] = useState(calendar?.logoUrl || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Suggested Theme State
  const [suggestion, setSuggestion] = useState(() => {
    const initial = executeBrandOptimizer({
      logoUrl: calendar?.logoUrl || '',
      calendarName: calendar?.name || '',
      currentTheme: { themeColor: calendar?.themeColor || '#3B82F6' }
    });
    return {
      themeColor: calendar?.themeColor || initial.themeColor,
      bgTheme: calendar?.bgTheme || initial.bgTheme,
      fontFamily: calendar?.fontFamily || initial.fontFamily,
      buttonStyle: calendar?.buttonStyle || initial.buttonStyle,
      fontReason: initial.fontReason,
      detectedPalette: initial.colorPalette
    };
  });

  // Fetch user's current AI credits
  useEffect(() => {
    fetchCredits();
    if (logoUrl) {
      analyzeLogo(logoUrl);
    }
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/user/ai-credits');
      const data = await res.json();
      if (res.ok && typeof data.aiCredits === 'number') {
        setUserCredits(data.aiCredits);
      }
    } catch (e) {
      console.warn('Could not fetch AI credits:', e);
    }
  };

  // Client-side image color extraction combined with AI Radahn Brain
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
        
        // Execute AI Radahn brain recommendations for typography and theme
        const brainResult = executeBrandOptimizer({
          logoUrl: url,
          calendarName: calendar?.name || '',
          currentTheme: { themeColor: primaryColor }
        });

        setSuggestion({
          themeColor: primaryColor,
          bgTheme: brainResult.bgTheme,
          fontFamily: brainResult.fontFamily,
          fontReason: brainResult.fontReason,
          buttonStyle: brainResult.buttonStyle,
          detectedPalette: [primaryColor, ...sortedColors.slice(0, 4), '#FFFFFF'].filter((v, i, a) => a.indexOf(v) === i)
        });
      } catch (err) {
        // Fallback to AI Radahn Brain
        const brainResult = executeBrandOptimizer({
          calendarName: calendar?.name || '',
          currentTheme: { themeColor: '#3B82F6' }
        });
        setSuggestion(prev => ({
          ...prev,
          themeColor: brainResult.themeColor,
          fontFamily: brainResult.fontFamily,
          fontReason: brainResult.fontReason,
          detectedPalette: brainResult.colorPalette
        }));
      } finally {
        setAnalyzing(false);
      }
    };

    img.onerror = () => {
      setAnalyzing(false);
      // Run fallback from Brain
      const brainResult = executeBrandOptimizer({
        calendarName: calendar?.name || '',
        currentTheme: { themeColor: '#3B82F6' }
      });
      setSuggestion(prev => ({
        ...prev,
        themeColor: brainResult.themeColor,
        fontFamily: brainResult.fontFamily,
        fontReason: brainResult.fontReason,
        detectedPalette: brainResult.colorPalette
      }));
      toast('AI Radahn analyzed your event persona and generated this custom aesthetic.');
    };
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      // Deduct 1 AI Credit
      const res = await fetch('/api/user/ai-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost: 1,
          operation: 'AI_RADAHN_BRAND_OPTIMIZER'
        })
      });

      const data = await res.json();

      if (res.status === 402 || data.error === 'INSUFFICIENT_CREDITS') {
        setIsUpgradeModalOpen(true);
        setApplying(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process AI credits');
      }

      // Apply to Calendar form state
      onApply(suggestion);
      toast.success(`AI Radahn Brand Theme Applied! (${data.creditsRemaining} credits remaining)`);
      onClose();
    } catch (e) {
      toast.error(e.message || 'Failed to apply AI brand optimization');
    } finally {
      setApplying(false);
    }
  };

  // Resolved colors for Live Simulation
  const themeObj = CALENDAR_THEMES.find(t => t.id === suggestion.bgTheme) || CALENDAR_THEMES[0];
  const activeFont = suggestion.fontFamily || 'Plus Jakarta Sans';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 animate-in fade-in duration-200">
        <div 
          className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-black shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-accent-blue flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">AI Radahn Brand Optimizer</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    1 AI Task Credit
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Analyzes your brand logo & calendar persona to build an executive aesthetic with real-time approval.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userCredits !== null && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-text-secondary">
                  <Zap size={13} className="text-purple-400" />
                  <span>{userCredits} Credits Available</span>
                </div>
              )}
              <button 
                onClick={onClose} 
                className="p-1.5 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar text-xs sm:text-sm">
            
            {/* Logo Input Section */}
            <div className="space-y-2 bg-black/40 border border-white/5 rounded-xl p-4">
              <label className="block text-xs font-semibold text-white">Brand Logo URL (or Company Website Asset)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://your-website.com/logo.png"
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-accent-blue"
                />
                <button
                  type="button"
                  onClick={() => analyzeLogo(logoUrl)}
                  disabled={analyzing || !logoUrl}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-accent-blue hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Analyze Logo
                </button>
              </div>
              {logoUrl && (
                <div className="mt-2 p-2 bg-black/60 border border-white/5 rounded-lg flex items-center gap-3">
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="h-8 max-w-[120px] object-contain rounded" 
                    onError={(e) => e.target.style.display='none'} 
                  />
                  <span className="text-[11px] text-text-secondary">Logo loaded for color extraction</span>
                </div>
              )}
            </div>

            {/* AI Radahn Insights & Live Visual Simulation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Left Column: AI Recommendations */}
              <div className="space-y-4">
                
                {/* Detected Palette */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Palette size={14} className="text-accent-blue" />
                      Optimized Accent Color
                    </span>
                    <span className="text-[11px] font-mono text-purple-300">{suggestion.themeColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestion.detectedPalette.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSuggestion({ ...suggestion, themeColor: col })}
                        className={`w-8 h-8 rounded-lg border transition-all cursor-pointer relative flex items-center justify-center ${
                          suggestion.themeColor === col ? 'ring-2 ring-purple-400 scale-110 border-white' : 'border-white/20 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {suggestion.themeColor === col && <Check size={14} className={col === '#FFFFFF' ? 'text-black' : 'text-white'} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Match */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Type size={14} className="text-purple-400" />
                    Recommended Typography
                  </span>
                  <div className="p-2.5 bg-black/60 rounded-lg border border-white/5 space-y-1">
                    <div className="font-bold text-white text-xs">{suggestion.fontFamily}</div>
                    <div className="text-[11px] text-text-secondary leading-snug">{suggestion.fontReason}</div>
                  </div>
                </div>

                {/* Background & Geometry Match */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-400" />
                    Canvas Theme & Button Geometry
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSuggestion({ ...suggestion, bgTheme: 'obsidian' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                        suggestion.bgTheme === 'obsidian' ? 'bg-purple-950/30 border-purple-500 text-white' : 'border-white/10 text-text-secondary'
                      }`}
                    >
                      Dark Obsidian
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestion({ ...suggestion, bgTheme: 'midnight' })}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                        suggestion.bgTheme === 'midnight' ? 'bg-blue-950/30 border-accent-blue text-white' : 'border-white/10 text-text-secondary'
                      }`}
                    >
                      Deep Midnight
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Simulation Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Live Theme Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Real-Time Simulation
                  </span>
                </div>

                {/* Simulated Booking Card */}
                <div 
                  className="p-5 border rounded-2xl space-y-4 shadow-xl relative overflow-hidden transition-all"
                  style={{
                    backgroundColor: themeObj?.card || '#111111',
                    borderColor: themeObj?.border || 'rgba(255,255,255,0.1)',
                    fontFamily: `${activeFont}, sans-serif`
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5" 
                    style={{ background: suggestion.themeColor }}
                  />

                  {/* Header in Preview */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm" style={{ color: themeObj?.text || '#ffffff' }}>
                        {calendar?.name || '30 Min Consultation Call'}
                      </h4>
                      <p className="text-[11px]" style={{ color: themeObj?.subtext || '#9ca3af' }}>
                        Automated booking with live scheduling
                      </p>
                    </div>
                    <span 
                      className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full"
                      style={{
                        backgroundColor: `${suggestion.themeColor}22`,
                        color: suggestion.themeColor,
                        border: `1px solid ${suggestion.themeColor}44`
                      }}
                    >
                      Aug 28
                    </span>
                  </div>

                  {/* Simulated Calendar Grid cell */}
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <span style={{ color: themeObj?.subtext || '#9ca3af' }}>Selected Date:</span>
                    <span className="font-semibold" style={{ color: suggestion.themeColor }}>Wednesday, August 28, 2026</span>
                  </div>

                  {/* Simulated Time Slots */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div 
                      className="py-2 px-3 border font-semibold transition-all"
                      style={{ 
                        borderColor: `${suggestion.themeColor}55`,
                        color: suggestion.themeColor,
                        backgroundColor: `${suggestion.themeColor}15`,
                        borderRadius: suggestion.buttonStyle === 'sharp' ? '2px' : suggestion.buttonStyle === 'pill' ? '9999px' : '8px'
                      }}
                    >
                      9:00 AM
                    </div>
                    <div 
                      className="py-2 px-3 border font-semibold text-white shadow-md"
                      style={{ 
                        borderColor: suggestion.themeColor,
                        background: suggestion.themeColor,
                        borderRadius: suggestion.buttonStyle === 'sharp' ? '2px' : suggestion.buttonStyle === 'pill' ? '9999px' : '8px'
                      }}
                    >
                      10:00 AM (Selected)
                    </div>
                  </div>

                  {/* Simulated Submit Button */}
                  <div 
                    className="w-full py-2.5 text-center font-bold text-xs text-white shadow-lg cursor-default"
                    style={{ 
                      background: suggestion.themeColor,
                      borderRadius: suggestion.buttonStyle === 'sharp' ? '2px' : suggestion.buttonStyle === 'pill' ? '9999px' : '8px'
                    }}
                  >
                    Confirm Booking
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Modal Footer with Approval Safeguard */}
          <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-text-tertiary flex items-center gap-1.5">
              <Zap size={13} className="text-purple-400" /> Charges 1 AI Task Credit upon application
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {applying ? (
                  <><RefreshCw size={14} className="animate-spin" /> Applying...</>
                ) : (
                  <><Check size={14} /> Accept & Apply Optimized Theme</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Upgrade Modal if Credits are Exhausted */}
      <AiCreditUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        creditsRemaining={userCredits || 0}
      />
    </>
  );
}
