'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOut } from 'next-auth/react';
import { LogOut, LayoutDashboard, Users, Workflow, Settings, Server, ExternalLink, XCircle, Link as LinkIcon, Activity, Globe, MoreHorizontal, ChevronRight, FileText, Shield, ScrollText, RefreshCw } from 'lucide-react';
import { startInngestDevServer, stopInngestDevServer, checkInngestStatus } from '@/actions/dev';
import Logo from '@/components/Logo';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminSidebar({ isMobile, onClose }) {
  const pathname = usePathname();
  const [inngestRunning, setInngestRunning] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLegalMenuOpen, setIsLegalMenuOpen] = useState(false);
  const legalMenuRef = useRef(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const check = async () => {
        const status = await checkInngestStatus();
        setInngestRunning(status);
      };
      check();
      const interval = setInterval(check, 15000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (legalMenuRef.current && !legalMenuRef.current.contains(event.target)) {
        setIsLegalMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={16} /> },
    { name: 'Users & Tenants', href: '/admin/users', icon: <Users size={16} /> },
    { name: 'Global Connections', href: '/admin/connections', icon: <LinkIcon size={16} /> },
    { name: 'Concierge Requests', href: '/admin/concierge', icon: <Globe size={16} /> },
    { name: 'Usage Analytics', href: '/admin/analytics', icon: <Activity size={16} /> },
    { name: 'System Workflows', href: '/admin/workflows', icon: <Workflow size={16} /> },
    { name: 'Platform Settings', href: '/admin/settings', icon: <Settings size={16} /> },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`w-64 border-r border-border-subtle bg-background flex flex-col ${isMobile ? 'h-full' : 'min-h-screen sticky top-0'}`}>
      <div className="p-4 flex items-center justify-center">
        <Logo size={24} />
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${
                active
                  ? 'text-foreground bg-card border border-border-subtle'
                  : 'text-text-secondary hover:text-foreground hover:bg-card border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Inngest Dev Mode Button */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="p-4 border-t border-border-subtle space-y-2" suppressHydrationWarning>
          <button
            suppressHydrationWarning
            onClick={async () => {
              if (inngestRunning) {
                setIsConfirmOpen(true);
              } else {
                try {
                  await startInngestDevServer();
                  setInngestRunning(true);
                } catch (e) {}
                window.open('http://127.0.0.1:8288', '_blank');
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors border ${
              inngestRunning 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' 
                : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border-accent-blue/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {inngestRunning ? <XCircle size={14} /> : <Server size={14} />}
              <span>{inngestRunning ? 'Stop Inngest Server' : 'Run Inngest Dev'}</span>
            </div>
            {!inngestRunning && <ExternalLink size={12} className="opacity-70" />}
          </button>
          
          {inngestRunning && (
            <button
              onClick={() => window.open('http://127.0.0.1:8288', '_blank')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors border bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border-accent-blue/20"
            >
              <div className="flex items-center gap-2">
                <ExternalLink size={14} />
                <span>Open Inngest UI</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Logout Button */}
      <div className="px-4 pt-4 pb-2 border-t border-border-subtle">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer Links (Legal) */}
      <div className="px-4 pb-4 relative" ref={legalMenuRef}>
        <button 
          onClick={() => setIsLegalMenuOpen(!isLegalMenuOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-card rounded-sm transition-colors border border-transparent"
        >
          <div className="flex items-center gap-3">
            <MoreHorizontal size={16} />
            <span>Legal & Info</span>
          </div>
          <ChevronRight size={14} className={`transition-transform ${isLegalMenuOpen ? 'rotate-90' : ''}`} />
        </button>

        {isLegalMenuOpen && (
          <div className="absolute bottom-full left-4 mb-2 w-56 bg-card border border-border-subtle rounded-md shadow-xl shadow-black/50 overflow-hidden z-50">
            <div className="p-1 flex flex-col">
              <Link 
                href="/privacy" 
                onClick={() => setIsLegalMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-sm flex items-center gap-3 transition-colors"
              >
                <Shield size={14} className="text-accent-blue" /> Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                onClick={() => setIsLegalMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-sm flex items-center gap-3 transition-colors"
              >
                <ScrollText size={14} className="text-accent-blue" /> Terms of Service
              </Link>
              <Link 
                href="/refunds" 
                onClick={() => setIsLegalMenuOpen(false)}
                className="px-3 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-sm flex items-center gap-3 transition-colors"
              >
                <RefreshCw size={14} className="text-accent-blue" /> Refund Policy
              </Link>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          await stopInngestDevServer();
          setInngestRunning(false);
          setIsConfirmOpen(false);
        }}
        title="Stop Inngest Server"
        message="Are you sure you want to shut down the local Inngest development server?"
        confirmText="Shut Down"
        isDestructive={true}
      />
    </aside>
  );
}
