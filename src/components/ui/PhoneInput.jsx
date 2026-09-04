'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { COUNTRIES } from '@/utils/countries';

export default function PhoneInput({
  value = '',
  onChange,
  placeholder = '234 567 890',
  disabled = false,
  className = '',
  required = false
}) {
  // Find initial country and national number from value
  const parseValue = (val) => {
    if (!val) return { country: COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0], number: '' };

    const clean = String(val).trim();
    // Try to find matching country dial code (longest first to avoid +1 vs +1242 ambiguity)
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dial)) {
        const rest = clean.slice(c.dial.length).trim();
        return { country: c, number: rest };
      }
    }

    // Check if format is "US +1 234567"
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      const matched = COUNTRIES.find(c => c.code === parts[0] || c.dial === parts[0]);
      if (matched) {
        return { country: matched, number: parts.slice(1).join(' ').trim() };
      }
    }

    return { country: COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0], number: clean };
  };

  const initial = useMemo(() => parseValue(value), []);
  const [selectedCountry, setSelectedCountry] = useState(initial.country);
  const [nationalNumber, setNationalNumber] = useState(initial.number);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync state when external value changes
  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedCountry(parsed.country);
    setNationalNumber(parsed.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    const fullNumber = nationalNumber ? `${country.dial} ${nationalNumber}`.trim() : country.dial;
    if (onChange) onChange(fullNumber);
  };

  const handleNumberChange = (e) => {
    const newNum = e.target.value;
    setNationalNumber(newNum);
    const fullNumber = newNum ? `${selectedCountry.dial} ${newNum}`.trim() : '';
    if (onChange) onChange(fullNumber);
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) || 
      c.dial.includes(q)
    );
  }, [searchQuery]);

  return (
    <div className={`relative flex items-center w-full ${className}`} ref={dropdownRef}>
      {/* Country Code Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-background border border-r-0 border-border-subtle rounded-l-sm text-sm text-foreground hover:bg-white/[0.04] transition-colors shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed h-[38px]"
        title={`${selectedCountry.name} (${selectedCountry.dial})`}
      >
        <img
          src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
          alt={selectedCountry.code}
          width="18"
          height="12"
          className="rounded-xs object-cover shadow-[0_0_2px_rgba(0,0,0,0.5)] shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <span className="font-mono text-xs font-semibold text-white shrink-0">{selectedCountry.dial}</span>
        <ChevronDown size={13} className={`text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Phone Number Input */}
      <input
        type="tel"
        disabled={disabled}
        required={required}
        value={nationalNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="w-full bg-background border border-border-subtle rounded-r-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue transition-colors h-[38px] font-mono"
      />

      {/* Custom Headless Country Selection Overlay (No native select per AGENTS.md) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-72 sm:w-80 bg-[#121214] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
            <Search size={14} className="text-text-tertiary shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code..."
              className="w-full bg-transparent border-none text-xs text-white placeholder:text-text-tertiary focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-text-tertiary hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Scrollable Country List */}
          <div className="overflow-y-auto divide-y divide-white/5 flex-1">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-tertiary">
                No matching country found.
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <div
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accent-blue/15 text-white font-semibold'
                        : 'hover:bg-white/5 text-text-secondary hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <img
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                        alt={country.code}
                        width="18"
                        height="12"
                        className="rounded-xs object-cover shadow-[0_0_1px_rgba(0,0,0,0.5)] shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="truncate">{country.name}</span>
                      <span className="text-[10px] text-text-tertiary font-mono shrink-0">({country.code})</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-accent-blue shrink-0">
                      {country.dial}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
