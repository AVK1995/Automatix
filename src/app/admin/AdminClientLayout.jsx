'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';

export default function AdminClientLayout({ children, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getPageTitle = (path) => {
    if (path === '/admin') return 'Dashboard';
    if (path.startsWith('/admin/users')) return 'Users & Tenants';
    if (path.startsWith('/admin/workflows')) return 'System Workflows';
    if (path.startsWith('/admin/settings')) return 'Platform Settings';
    if (path.startsWith('/admin/concierge')) return 'Concierge Requests';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border-subtle bg-background relative z-[50]">
        <h1 className="text-foreground font-semibold">Automatix Admin</h1>
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

      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay (Framer Motion) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-background z-40 md:hidden shadow-2xl"
            >
              <AdminSidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col">
        <header className="hidden md:flex h-14 items-center bg-background/80 backdrop-blur-md sticky top-0 z-[50] border-b border-border-subtle">
          <div className="w-full px-4 md:px-8 flex justify-between items-center">
            <h1 className="text-sm font-medium text-text-secondary">{getPageTitle(pathname)}</h1>
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <ProfileDropdown user={user} />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
