'use client';

import { motion } from 'framer-motion';

export default function Toggle({ checked, onChange, disabled, label, description, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`} onClick={() => !disabled && onChange(!checked)}>
      <div 
        className={`relative mt-0.5 w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-accent-blue' : 'bg-white/10'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ x: checked ? 20 : 2 }}
          className="absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        {/* Hidden native input for accessibility */}
        <input 
          type="checkbox" 
          className="absolute opacity-0 w-0 h-0" 
          checked={checked} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)} 
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col select-none">
          {label && <span className="text-sm font-medium text-white/90">{label}</span>}
          {description && <span className="text-xs text-white/50 mt-1 leading-relaxed">{description}</span>}
        </div>
      )}
    </div>
  );
}
