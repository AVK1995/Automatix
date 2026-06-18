'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin' },
    { name: 'Workflows', href: '/admin/workflows' },
    { name: 'Users & Tenants', href: '/admin/users' },
    { name: 'System Settings', href: '/admin/settings' },
  ];

  // Helper to determine if a route is active
  // Since '/admin' is a prefix for others, we need exact match for it, and prefix match for others.
  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-border-subtle bg-background flex flex-col">
      <div className="p-4 border-b border-border-subtle">
        <h2 className="text-foreground font-semibold">Automatix Admin</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </aside>
  );
}
