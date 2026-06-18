'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function AdminSidebar({ isMobile, onClose }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin' },
    { name: 'Workflows', href: '/admin/workflows' },
    { name: 'Users & Tenants', href: '/admin/users' },
    { name: 'System Settings', href: '/admin/settings' },
  ];

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`w-64 border-r border-border-subtle bg-background flex flex-col ${isMobile ? 'h-full' : 'min-h-screen sticky top-0'}`}>
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <h2 className="text-foreground font-semibold">Automatix Admin</h2>
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
              className={`block px-3 py-2 text-sm rounded-sm transition-colors ${
                active
                  ? 'text-foreground bg-card border border-border-subtle'
                  : 'text-text-secondary hover:text-foreground hover:bg-card border border-transparent'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-border-subtle">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
