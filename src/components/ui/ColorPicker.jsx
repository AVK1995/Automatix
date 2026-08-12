import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pipette } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#14B8A6', '#F43F5E', '#6366F1',
  '#F97316', '#84CC16', '#22C55E', '#0EA5E9', '#A855F7'
];

export default function ColorPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value || '#3B82F6');
  const popoverRef = useRef(null);

  useEffect(() => {
    setHexValue(value || '#3B82F6');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHexChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setHexValue(val);
    if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
      onChange(val);
    }
  };

  const handleColorSelect = (color) => {
    setHexValue(color);
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue hover:bg-black/70 transition-colors w-full justify-between h-9"
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-[4px] border border-white/20 shadow-sm"
            style={{ backgroundColor: hexValue }}
          />
          <span className="font-mono text-text-secondary">{hexValue.toUpperCase()}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 p-3 bg-[#111] border border-white/10 rounded-lg shadow-2xl w-64"
          >
            <div className="mb-3">
              <label className="text-[10px] uppercase font-semibold text-text-tertiary mb-1.5 block">Preset Colors</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className="w-10 h-10 rounded-md shadow-sm border border-white/5 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-1 focus:ring-offset-[#111]"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <label className="text-[10px] uppercase font-semibold text-text-tertiary mb-1.5 flex items-center gap-1">
                <Pipette className="w-3 h-3" /> Custom Hex
              </label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-md border border-white/20 shrink-0"
                  style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(hexValue) || /^#[0-9A-F]{3}$/i.test(hexValue) ? hexValue : 'transparent' }}
                />
                <input
                  type="text"
                  value={hexValue}
                  onChange={handleHexChange}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-accent-blue uppercase"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
