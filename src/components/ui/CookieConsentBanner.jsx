'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('automatix_cookie_consent');
      if (!consent) {
        // Show after small delay so it enters smoothly
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('automatix_cookie_consent', 'granted');
      setShowBanner(false);
    } catch (e) {}
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('automatix_cookie_consent', 'essential_only');
      setShowBanner(false);
    } catch (e) {}
  };

  if (!showBanner) return null;

  return (
    <aside aria-label="Cookie consent banner" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[99999] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/95 border border-purple-500/30 text-white shadow-2xl shadow-purple-950/40 relative overflow-hidden flex flex-col gap-3">
        {/* Subtle top neon line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Cookie size={16} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">Cookie & Session Preferences</h4>
              <p className="text-[10px] text-text-tertiary font-mono">GDPR & Data Protection Compliant</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDecline}
            className="p-1 rounded-lg hover:bg-white/10 text-text-tertiary hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Automatix uses essential authentication cookies and local storage to secure your AI Key Vault, maintain realtime webhook triggers, and optimize multimodal media streaming.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <Link
            href="/privacy"
            className="text-[11px] text-purple-300 hover:text-purple-200 underline flex items-center gap-1"
          >
            <span>Privacy Policy</span>
            <ArrowRight size={11} />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check size={12} strokeWidth={3} />
              <span>Accept All</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
