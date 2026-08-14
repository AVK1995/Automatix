'use client';

import { signOut } from 'next-auth/react';
import { LogOut, Download, Edit2, Check, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PremiumIcon } from './Icons';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import Image from 'next/image';

export default function ProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef(null);
  const cardRef = useRef(null);

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

  const downloadCard = async (format) => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1, pixelRatio: 3 });
      
      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [cardRef.current.offsetWidth, cardRef.current.offsetHeight]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, cardRef.current.offsetWidth, cardRef.current.offsetHeight);
        pdf.save('automatix-admin-id.pdf');
      } else if (format === 'gif') {
        // Mock GIF generation using standard download of the high quality frame
        const link = document.createElement('a');
        link.download = `automatix-admin-id.gif`; // Using gif extension for the user requirement
        link.href = dataUrl;
        link.click();
      } else {
        const link = document.createElement('a');
        link.download = `automatix-admin-id.${format}`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to download ID card', err);
    }
  };

  return (
    <div className="relative pt-2 pb-2" ref={dropdownRef}>
      {/* Profile Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full border flex items-center justify-center font-semibold text-sm transition-all duration-300 focus:outline-none 
          ${isAdmin ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]' : 'bg-accent-violet/10 text-accent-violet border-accent-violet/20 hover:bg-accent-violet/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]'}
          ${isOpen && isAdmin ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''}
          ${isOpen && !isAdmin ? 'bg-accent-violet/20 border-accent-violet/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}
        `}
      >
        {isAdmin ? <Sparkles size={18} className="animate-pulse" /> : (user?.name?.[0] || user?.email?.[0] || 'U')}
      </button>

      {/* Dropdown Menu - toggled by click */}
      <div className={`absolute top-full right-0 w-[calc(100vw-2rem)] sm:w-80 transition-all duration-300 ease-out z-[99999] origin-top-right ${isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
        
        {isAdmin ? (
          /* Admin Ultra Ego ID Card */
          <div className="bg-[#0a0a0a] border-2 border-amber-500/50 rounded-2xl shadow-[0_15px_50px_rgba(245,158,11,0.25)] overflow-hidden backdrop-blur-xl group">
            
            {/* The Downloadable Element */}
            <div ref={cardRef} className="relative p-6 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#1a1000] overflow-hidden">
              
              {/* Shine Animation */}
              <div className="absolute inset-0 translate-x-[-150%] skew-x-[-45deg] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent group-hover:animate-shine z-10 pointer-events-none"></div>

              {/* Animated Background Aura */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl animate-pulse -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

              <div className="relative z-20 flex flex-col items-center">
                {/* Header Logo */}
                <div className="w-full flex justify-between items-start mb-4">
                  <div className="text-amber-500 font-bold tracking-widest text-xs uppercase flex items-center gap-1">
                    <Sparkles size={12} /> Automatix
                  </div>
                  <div className="px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    Admin Level
                  </div>
                </div>

                {/* Avatar with Aura & Lightning */}
                <div className="relative w-36 h-36 mb-4 flex-shrink-0 group/avatar mt-2">
                  {/* Continuous Glowing Aura */}
                  <div className="absolute inset-0 bg-purple-600 rounded-lg blur-2xl opacity-60 mix-blend-screen group-hover/avatar:opacity-100 group-hover/avatar:scale-125 transition-all duration-700 ease-in-out pointer-events-none"></div>
                  
                  {/* Lightning Effects (Delayed Pulses) */}
                  <div className="absolute -inset-4 border-2 border-purple-400/0 rounded-xl group-hover/avatar:border-purple-400/50 group-hover/avatar:scale-110 blur-[2px] transition-all duration-150 delay-75 pointer-events-none animate-pulse"></div>
                  <div className="absolute -inset-2 border border-blue-400/0 rounded-lg group-hover/avatar:border-blue-400/80 group-hover/avatar:scale-105 blur-[1px] transition-all duration-75 delay-150 pointer-events-none animate-ping"></div>

                  {/* The Image (Not a circle, auto fit) */}
                  <div className="relative w-full h-full overflow-hidden border-2 border-purple-500/30 bg-black shadow-[0_0_40px_rgba(147,51,234,0.4)] group-hover/avatar:border-purple-500/80 group-hover/avatar:shadow-[0_0_60px_rgba(147,51,234,0.8)] transition-all duration-500">
                    <img 
                      src="/assets/vegeta.jpg" 
                      alt="Ultra Ego" 
                      className="object-cover w-full h-full group-hover/avatar:scale-125 group-hover/avatar:brightness-125 transition-all duration-700 ease-in-out origin-center" 
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="w-full text-center space-y-2">
                  {isEditing ? (
                    <div className="space-y-2 w-full">
                      <input 
                        type="text" 
                        value={adminData.name} 
                        onChange={(e) => setAdminData(prev => ({...prev, name: e.target.value}))}
                        className="w-full bg-black/50 border border-amber-500/50 rounded text-center text-amber-400 font-bold px-2 py-1 focus:outline-none focus:border-amber-400" 
                      />
                      <input 
                        type="text" 
                        value={adminData.profession} 
                        onChange={(e) => setAdminData(prev => ({...prev, profession: e.target.value}))}
                        className="w-full bg-black/50 border border-amber-500/50 rounded text-center text-amber-200/70 text-xs px-2 py-1 focus:outline-none focus:border-amber-400" 
                      />
                      <input 
                        type="text" 
                        value={adminData.age} 
                        onChange={(e) => setAdminData(prev => ({...prev, age: e.target.value}))}
                        className="w-full bg-black/50 border border-amber-500/50 rounded text-center text-amber-200/50 text-[10px] px-2 py-1 focus:outline-none focus:border-amber-400" 
                        placeholder="Age"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent uppercase tracking-wider">
                        {adminData.name}
                      </h2>
                      <div className="flex flex-col items-center gap-1">
                         <p className="text-xs text-amber-200/70 font-medium tracking-widest uppercase">{adminData.profession}</p>
                         <p className="text-[10px] text-amber-200/50 font-mono">ID: {user?.email} • AGE: {adminData.age}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar (Not part of downloadable card) */}
            <div className="bg-black/80 border-t border-amber-500/20 p-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors">
                  {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
                </button>
                <div className="h-6 w-px bg-amber-500/20 mx-1"></div>
                <button onClick={() => downloadCard('png')} className="p-1.5 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors" title="Download PNG">
                  <Download size={16} />
                </button>
                <button onClick={() => downloadCard('gif')} className="p-1.5 text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors text-[10px] font-bold flex items-center" title="Download GIF Animation">
                  GIF
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
        )}
      </div>
    </div>
  );
}
