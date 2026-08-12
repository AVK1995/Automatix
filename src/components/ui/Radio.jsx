'use client';

import { motion } from 'framer-motion';

export default function Radio({ checked, onChange, label, name, value, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <div 
        className={`relative w-4 h-4 rounded-full border transition-colors flex items-center justify-center shrink-0 ${
          checked 
            ? 'bg-transparent border-accent-blue' 
            : 'bg-black/50 border-white/20 group-hover:border-white/40'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-2 h-2 rounded-full bg-accent-blue"
          />
        )}
        
        {/* Hidden native input for accessibility */}
        <input 
          type="radio" 
          name={name}
          value={value}
          className="absolute opacity-0 w-0 h-0" 
          checked={checked} 
          onChange={(e) => onChange(e.target.value)} 
        />
      </div>
      {label && <span className="text-sm text-white/80 group-hover:text-white transition-colors select-none">{label}</span>}
    </label>
  );
}
