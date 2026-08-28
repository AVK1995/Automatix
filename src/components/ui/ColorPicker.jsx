'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette, Sparkles, SlidersHorizontal, Hash, Palette, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#14B8A6', '#F43F5E', '#6366F1',
  '#F97316', '#84CC16', '#22C55E', '#0EA5E9', '#A855F7',
  '#FFFFFF', '#E2E8F0', '#94A3B8', '#64748B', '#000000'
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  'linear-gradient(135deg, #F43F5E 0%, #F59E0B 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
  'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #22C55E 100%)',
];

// Helper: hex to rgb
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Helper: rgb to hex
function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(Number(val) || 0)));
  const toHex = (n) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export default function ColorPicker({ 
  value = '#3B82F6', 
  onChange, 
  allowGradients = true,
  customTrigger = null,
  align = 'left' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('hex'); // 'hex' | 'rgb' | 'grad'
  const [currentColor, setCurrentColor] = useState(value || '#3B82F6');
  const [rgbState, setRgbState] = useState(() => {
    try {
      return hexToRgb(value.startsWith('#') ? value : '#3B82F6');
    } catch {
      return { r: 59, g: 130, b: 246 };
    }
  });

  const popoverRef = useRef(null);

  useEffect(() => {
    setCurrentColor(value || '#3B82F6');
    if (value && value.startsWith('#')) {
      try {
        setRgbState(hexToRgb(value));
      } catch {}
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleHexInput = (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && !val.startsWith('linear-gradient')) val = '#' + val;
    setCurrentColor(val);
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      onChange?.(val);
      try { setRgbState(hexToRgb(val)); } catch {}
    }
  };

  const handleRgbChange = (channel, val) => {
    const num = Math.max(0, Math.min(255, parseInt(val, 10) || 0));
    const newRgb = { ...rgbState, [channel]: num };
    setRgbState(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setCurrentColor(hex);
    onChange?.(hex);
  };

  const handleSelectColor = (col) => {
    setCurrentColor(col);
    if (col.startsWith('#')) {
      try { setRgbState(hexToRgb(col)); } catch {}
    }
    onChange?.(col);
  };

  const handleEyeDropper = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleSelectColor(result.sRGBHex.toUpperCase());
        }
      } catch (e) {
        // User cancelled or unsupported
      }
    }
  };

  const isGradient = currentColor.startsWith('linear-gradient') || currentColor.startsWith('radial-gradient');

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      {customTrigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {customTrigger(currentColor)}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue hover:bg-black/70 transition-colors w-full justify-between h-9"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="w-4 h-4 rounded-[4px] border border-white/20 shadow-sm shrink-0"
              style={{ background: currentColor }}
            />
            <span className="font-mono text-xs text-text-secondary truncate">
              {isGradient ? 'Gradient Theme' : currentColor.toUpperCase()}
            </span>
          </div>
          <Palette className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] mt-2 p-3.5 bg-[#141414] border border-white/10 rounded-xl shadow-2xl w-72 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Header Tabs: HEX | RGB | GRADIENT */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('hex')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'hex' ? 'bg-white/15 text-white font-semibold shadow-sm' : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  HEX
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rgb')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'rgb' ? 'bg-white/15 text-white font-semibold shadow-sm' : 'text-text-tertiary hover:text-white'
                  }`}
                >
                  RGB
                </button>
                {allowGradients && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('grad')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeTab === 'grad' ? 'bg-white/15 text-white font-semibold shadow-sm' : 'text-text-tertiary hover:text-white'
                    }`}
                  >
                    Grad
                  </button>
                )}
              </div>

              {/* Eyedropper API (if supported) */}
              {typeof window !== 'undefined' && 'EyeDropper' in window && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  className="p-1.5 rounded-md hover:bg-white/10 text-text-tertiary hover:text-white transition-colors"
                  title="Pick color from screen"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tab 1: HEX mode */}
            {activeTab === 'hex' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-9 h-9 rounded-lg border border-white/20 shadow-inner shrink-0"
                    style={{ background: currentColor }}
                  />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={currentColor}
                      onChange={handleHexInput}
                      placeholder="#3B82F6"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-accent-blue uppercase font-bold"
                    />
                  </div>
                  {/* Native Color HTML Input helper */}
                  <label className="cursor-pointer p-1.5 rounded-lg bg-black/50 border border-white/10 hover:bg-white/10 transition-colors shrink-0" title="Open Color Spectrum">
                    <input 
                      type="color" 
                      value={currentColor.startsWith('#') && (currentColor.length === 7 || currentColor.length === 4) ? currentColor : '#3B82F6'}
                      onChange={(e) => handleSelectColor(e.target.value.toUpperCase())}
                      className="opacity-0 w-0 h-0 absolute"
                    />
                    <Palette className="w-4 h-4 text-accent-blue" />
                  </label>
                </div>
              </div>
            )}

            {/* Tab 2: RGB mode */}
            {activeTab === 'rgb' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg border border-white/20 shadow-inner shrink-0"
                    style={{ background: rgbToHex(rgbState.r, rgbState.g, rgbState.b) }}
                  />
                  <span className="font-mono text-xs font-bold text-white">
                    {rgbToHex(rgbState.r, rgbState.g, rgbState.b)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <label className="text-[10px] text-red-400 font-bold uppercase block mb-1">R</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbState.r}
                      onChange={(e) => handleRgbChange('r', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-md px-1 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-green-400 font-bold uppercase block mb-1">G</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbState.g}
                      onChange={(e) => handleRgbChange('g', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-md px-1 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-blue-400 font-bold uppercase block mb-1">B</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={rgbState.b}
                      onChange={(e) => handleRgbChange('b', e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-md px-1 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Gradients mode */}
            {activeTab === 'grad' && allowGradients && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block">
                  Vibrant Gradient Presets
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectColor(grad)}
                      className={`h-9 rounded-lg border transition-all flex items-center justify-center ${
                        currentColor === grad ? 'scale-105 border-white ring-2 ring-white/30' : 'border-white/10 hover:scale-105'
                      }`}
                      style={{ background: grad }}
                    >
                      {currentColor === grad && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Curated Preset Swatches (Always accessible below) */}
            <div className="mt-3.5 pt-3 border-t border-white/10">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-2 block">
                Preset Palette
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`h-7 rounded-md shadow-sm border transition-all flex items-center justify-center ${
                      currentColor.toLowerCase() === color.toLowerCase()
                        ? 'scale-110 border-white ring-2 ring-white/30 shadow-md' 
                        : 'border-white/10 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {currentColor.toLowerCase() === color.toLowerCase() && (
                      <Check className={`w-3 h-3 ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
