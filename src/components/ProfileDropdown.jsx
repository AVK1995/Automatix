'use client';

import { signOut } from 'next-auth/react';
import { LogOut, Download, Edit2, Check, Sparkles, Upload, Crown, Zap, Coins, HardDrive, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PremiumIcon } from './Icons';
import Image from 'next/image';
import LightningOverlay from './ui/LightningOverlay';

export default function ProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customVideo, setCustomVideo] = useState(null);
  
  const dropdownRef = useRef(null);
  const videoRef = useRef(null);
  const [isLightningActive, setIsLightningActive] = useState(false);
  const hasShockwaved = useRef(false);
  const fileInputRef = useRef(null);

  // Editable Admin Fields
  const [adminData, setAdminData] = useState({
    name: 'Automatix Admin',
    profession: 'QA Engineer',
    age: '30'
  });

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsEditing(false); // Close edit mode if clicked outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideo(url);
    }
  };

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Autoplay blocked:", e));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    hasShockwaved.current = false;
    document.body.classList.remove('animate-global-shockwave');
    setIsLightningActive(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 6.0 && !hasShockwaved.current) {
      hasShockwaved.current = true;
      setIsLightningActive(true);
      document.body.classList.add('animate-global-shockwave');
      // Clean up the class after the animation completes (2.5s)
      setTimeout(() => {
        document.body.classList.remove('animate-global-shockwave');
        setIsLightningActive(false);
      }, 2500);
    }
  };

  return (
    <div className="relative pt-2 pb-2" ref={dropdownRef}>
      {/* Profile Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full border flex items-center justify-center font-semibold text-sm transition-all duration-300 focus:outline-none 
          ${isAdmin ? 'bg-purple-500/10 text-purple-500 border-purple-500/50 hover:bg-purple-500/20 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'bg-accent-violet/10 text-accent-violet border-accent-violet/20 hover:bg-accent-violet/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]'}
          ${isOpen && isAdmin ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.5)]' : ''}
          ${isOpen && !isAdmin ? 'bg-accent-violet/20 border-accent-violet/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}
        `}
      >
        {isAdmin ? <Sparkles size={18} className="animate-pulse" /> : (user?.name?.[0] || user?.email?.[0] || 'U')}
      </button>

      {/* Dropdown Menu - toggled by click */}
      <div className={`fixed top-[72px] left-4 right-4 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-[448px] transition-all duration-300 ease-out z-40 sm:origin-top-right ${isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
        
        {isAdmin ? (
          /* Admin ID Card - Video Background */
          <div className="bg-[#0a0a0a] border-2 border-purple-500/50 rounded-2xl shadow-[0_15px_50px_rgba(168,85,247,0.25)] overflow-hidden backdrop-blur-xl">
            
            <div 
              className="relative w-full aspect-video overflow-hidden group bg-black"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              
              {/* The Video Background */}
              <video 
                ref={videoRef}
                src={customVideo || "/assets/power up.mp4"}
                className="absolute inset-0 w-full h-full object-cover z-0 brightness-75 group-hover:brightness-100 transition-all duration-500"
                onTimeUpdate={handleTimeUpdate}
                loop
                muted={false} // Play with sound as requested
              />

              {/* Content Overlay */}
              <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between bg-black/40 group-hover:bg-transparent transition-colors duration-500">
                {/* Header Logo */}
                <div className="w-full flex justify-between items-start">
                  <div className="text-purple-400 font-bold tracking-widest text-xs uppercase flex items-center gap-1 drop-shadow-md">
                    <Sparkles size={12} /> Automatix
                  </div>
                  <div className="px-2 py-0.5 rounded border border-purple-500/50 bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    Admin Level
                  </div>
                </div>

                {/* Details positioned at the bottom */}
                <div className="w-full text-center space-y-2 backdrop-blur-sm bg-black/30 p-3 rounded-xl border border-white/5">
                  {isEditing ? (
                    <div className="space-y-2 w-full">
                      <input 
                        type="text" 
                        value={adminData.name} 
                        onChange={(e) => setAdminData(prev => ({...prev, name: e.target.value}))}
                        className="w-full bg-black/70 border border-purple-500/50 rounded text-center text-purple-400 font-bold px-2 py-1 focus:outline-none focus:border-purple-400" 
                      />
                      <input 
                        type="text" 
                        value={adminData.profession} 
                        onChange={(e) => setAdminData(prev => ({...prev, profession: e.target.value}))}
                        className="w-full bg-black/70 border border-purple-500/50 rounded text-center text-purple-200/70 text-xs px-2 py-1 focus:outline-none focus:border-purple-400" 
                      />
                      <input 
                        type="text" 
                        value={adminData.age} 
                        onChange={(e) => setAdminData(prev => ({...prev, age: e.target.value}))}
                        className="w-full bg-black/70 border border-purple-500/50 rounded text-center text-purple-200/50 text-[10px] px-2 py-1 focus:outline-none focus:border-purple-400" 
                        placeholder="Age"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 bg-clip-text text-transparent uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {adminData.name}
                      </h2>
                      <div className="flex flex-col items-center gap-1">
                         <p className="text-xs text-purple-200/90 font-medium tracking-widest uppercase drop-shadow-md">{adminData.profession}</p>
                         <p className="text-[10px] text-purple-200/70 font-mono drop-shadow-md">ID: {user?.email} • AGE: {adminData.age}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-black/80 border-t border-purple-500/20 p-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors" title="Edit Info">
                  {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                </button>
                <div className="h-6 w-px bg-purple-500/20 mx-1"></div>
                
                {/* Hidden File Input for Video */}
                <input 
                  type="file" 
                  accept="video/*" 
                  ref={fileInputRef} 
                  onChange={handleVideoUpload} 
                  className="hidden" 
                />
                
                {/* Change Video Button */}
                <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors text-[10px] font-bold flex items-center gap-1" title="Change Video">
                  <Upload size={14} /> Video
                </button>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Regular Client Profile Dropdown */
          <div className="bg-[#0e0e11] border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* User Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {user?.name || 'Automatix User'}
                  </h3>
                  <p className="text-xs text-text-tertiary truncate font-mono">
                    {user?.email}
                  </p>
                </div>
                {/* Plan Badge */}
                {(() => {
                  const rawTier = (user?.subscriptionTier || 'starter').toLowerCase();
                  if (rawTier === 'enterprise') {
                    return (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-sm shrink-0">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Enterprise</span>
                      </div>
                    );
                  }
                  if (rawTier === 'professional' || rawTier === 'pro') {
                    return (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-[10px] font-bold uppercase tracking-wider shadow-sm shrink-0">
                        <Zap className="w-3 h-3 text-accent-blue" />
                        <span>Professional</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <Sparkles className="w-3 h-3 text-white/50" />
                      <span>Starter Plan</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Active Quotas & Add-ons Section */}
            <div className="p-3.5 space-y-2.5 bg-black/40 border-b border-white/5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-text-tertiary font-medium">
                <span className="uppercase tracking-wider">Active Quotas & Addons</span>
                <Link href="/dashboard/billing" onClick={() => setIsOpen(false)} className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5">
                  Manage <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Storage Quota Card */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cloud Storage</span>
                  </div>
                  <span className="font-semibold text-white font-mono text-[11px]">
                    {user?.totalStorageUsedMB ?? 0} MB <span className="text-text-tertiary">/ {user?.maxStorageMB || 50} MB</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-accent-blue rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(2, (((user?.totalStorageUsedMB ?? 0) / (user?.maxStorageMB || 50)) * 100)))}%` }}
                  />
                </div>
              </div>

              {/* AI Credits & Tier Pills */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                  <div className="p-1 rounded bg-accent-blue/10 text-accent-blue">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold">AI Credits</p>
                    <p className="text-xs font-bold text-white truncate">
                      {user?.aiCredits ?? 10} <span className="text-[10px] font-normal text-text-tertiary">Credits</span>
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                  <div className="p-1 rounded bg-white/10 text-white/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-text-tertiary uppercase font-semibold">Storage Pack</p>
                    <p className="text-xs font-bold text-white truncate">
                      {user?.quotaTier ? user.quotaTier.replace(/\s*\(.*?\)/, '') : 'Base Plan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Out Action */}
            <div className="p-2 bg-black/60">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-semibold cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <LightningOverlay isActive={isLightningActive} />
    </div>
  );
}
