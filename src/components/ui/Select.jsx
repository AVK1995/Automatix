'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function Select({ value, onChange, options, placeholder = 'Select an option', className = '', buttonClassName = 'py-2', creatable = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || (creatable && value ? { value, label: value } : null);

  const allOptions = useMemo(() => {
    if (creatable && value && !options.some(opt => opt.value === value)) {
      return [{ value, label: value }, ...options];
    }
    return options;
  }, [options, creatable, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const q = searchQuery.toLowerCase();
    return allOptions.filter(opt => {
      const textToSearch = opt.searchLabel || (typeof opt.label === 'string' ? opt.label : opt.value);
      return textToSearch.toLowerCase().includes(q);
    });
  }, [allOptions, searchQuery]);

  const exactMatch = useMemo(() => {
    return allOptions.some(opt => {
      const textToSearch = opt.searchLabel || (typeof opt.label === 'string' ? opt.label : opt.value);
      return opt.value.toLowerCase() === searchQuery.trim().toLowerCase() || 
             textToSearch.toLowerCase() === searchQuery.trim().toLowerCase();
    });
  }, [allOptions, searchQuery]);
  
  const showCustomOption = creatable && searchQuery.trim() !== '' && !exactMatch;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/50 border border-white/10 rounded-md px-3 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors ${buttonClassName} ${isOpen ? 'border-accent-blue' : ''}`}
      >
        <span className={`truncate text-left flex items-center gap-2 ${selectedOption ? 'text-white' : 'text-white/50'}`}>
          {selectedOption?.icon && <span className="shrink-0 flex items-center">{selectedOption.icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 min-w-full w-max mt-1 bg-[#111] backdrop-blur-xl border border-white/10 rounded-md shadow-2xl overflow-hidden max-h-72 flex flex-col"
          >
            <div className="p-2 border-b border-white/5 shrink-0 bg-black/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 pl-8 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue placeholder:text-white/30"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-1">
              {showCustomOption && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(searchQuery.trim());
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left text-accent-blue hover:bg-accent-blue/10 border-b border-white/5"
                >
                  <span className="break-words">Use "{searchQuery.trim()}"</span>
                </button>
              )}
              
              {filteredOptions.length === 0 && !showCustomOption ? (
                <div className="px-3 py-4 text-xs text-text-tertiary text-center">
                  No matches found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left
                      ${value === option.value ? 'bg-accent-blue/20 text-accent-blue' : 'text-white hover:bg-white/5'}
                    `}
                  >
                    <span className="truncate flex items-center gap-2">
                      {option.icon && <span className="shrink-0 flex items-center">{option.icon}</span>}
                      {option.label}
                    </span>
                    {value === option.value && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
