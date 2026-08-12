'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Checkbox({ checked, onChange, label, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <div 
        className={`relative w-4 h-4 rounded-[4px] border transition-colors flex items-center justify-center shrink-0 ${
          checked 
            ? 'bg-accent-blue border-accent-blue' 
            : 'bg-black/50 border-white/20 group-hover:border-white/40'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
        
        {/* Hidden native input for accessibility */}
        <input 
          type="checkbox" 
          className="absolute opacity-0 w-0 h-0" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
      </div>
      {label && <span className="text-sm text-white/80 group-hover:text-white transition-colors select-none">{label}</span>}
    </label>
  );
}
