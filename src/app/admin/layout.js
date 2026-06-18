export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border-subtle bg-background flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-foreground font-semibold">Automatix Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/admin" className="block px-3 py-2 text-sm text-foreground bg-card rounded-sm border border-border-subtle">
            Overview
          </a>
          <a href="/admin/workflows" className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-card rounded-sm transition-colors">
            Workflows
          </a>
          <a href="/admin/users" className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-card rounded-sm transition-colors">
            Users & Tenants
          </a>
          <a href="/admin/settings" className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground hover:bg-card rounded-sm transition-colors">
            System Settings
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-14 border-b border-border-subtle flex items-center px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <h1 className="text-sm font-medium text-text-secondary">Dashboard / Overview</h1>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
