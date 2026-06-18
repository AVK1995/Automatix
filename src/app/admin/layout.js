import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

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
