'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PremiumIcon } from './Icons';

export default function ProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative pt-2 pb-2" ref={dropdownRef}>
      {/* Profile Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full bg-accent-violet/10 border flex items-center justify-center text-accent-violet font-semibold text-sm transition-all duration-300 hover:bg-accent-violet/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] focus:outline-none ${isOpen ? 'bg-accent-violet/20 border-accent-violet/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-accent-violet/20'}`}
      >
        {user?.name?.[0] || user?.email?.[0] || 'U'}
      </button>

      {/* Dropdown Menu - toggled by click */}
      <div className={`absolute top-full right-0 w-64 transition-all duration-300 ease-out z-50 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
        <div className="bg-[#0f0f0f] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-accent-violet/10 to-accent-blue/10 rounded-md border border-white/5">
                <PremiumIcon className="w-3 h-3 text-accent-violet" />
                <span className="text-[9px] uppercase font-bold tracking-wider bg-gradient-to-r from-accent-violet to-accent-blue bg-clip-text text-transparent">
                  {user?.subscriptionTier || 'Free'} Plan
                </span>
              </div>
            </div>
            <p className="text-xs text-white/50 truncate">
              {user?.email}
            </p>
          </div>
          <div className="p-2 bg-black/20">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
