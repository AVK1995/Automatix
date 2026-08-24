'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function Checkbox({ 
  checked = false, 
  onChange, 
  label, 
  id, 
  name, 
  disabled = false, 
  className = '',
  labelClassName = ''
}) {
  return (
    <label 
      htmlFor={id} 
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div 
        className={`relative w-4 h-4 rounded-md border transition-all duration-150 flex items-center justify-center flex-shrink-0 shrink-0 ${
          checked 
            ? 'bg-accent-blue border-accent-blue text-white shadow-sm shadow-accent-blue/25 ring-1 ring-accent-blue/50' 
            : 'bg-[#111] border-white/20 group-hover:border-white/40'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
          </motion.div>
        )}
        
        <input 
          id={id}
          name={name}
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked, e)} 
        />
      </div>
      {label && (
        <span className={`text-xs sm:text-sm font-medium text-white/80 group-hover:text-white transition-colors leading-normal ${labelClassName}`}>
          {label}
        </span>
      )}
    </label>
  );
}
