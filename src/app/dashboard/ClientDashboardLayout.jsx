'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ClientSidebar from './ClientSidebar';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';
import Chatbot from '@/components/ui/Chatbot';

export default function ClientDashboardLayout({ children, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/dashboard/workflows')) return 'Workflows';
    if (path.startsWith('/dashboard/connections')) return 'Global Connections';
    if (path.startsWith('/dashboard/settings')) return 'Settings';
    if (path.startsWith('/dashboard/calendars')) return 'Calendars';
    return 'Client Portal';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-background z-20 border-b border-border-subtle">
        <h1 className="text-foreground font-semibold">Client Portal</h1>
        <div className="flex items-center gap-2">
          <NotificationDropdown />
          <ProfileDropdown user={user} />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-text-secondary hover:text-foreground"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ClientSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-background z-50 md:hidden shadow-2xl"
            >
              <ClientSidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col">
        <header className="hidden md:flex h-14 items-center bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border-subtle">
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex justify-between items-center">
            <h1 className="text-sm font-medium text-text-secondary">{getPageTitle(pathname)}</h1>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <ProfileDropdown user={user} />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
      
      <Chatbot />
    </div>
  );
}
