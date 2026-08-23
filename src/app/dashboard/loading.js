import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      <p className="text-sm text-text-secondary">Loading dashboard...</p>
    </div>
  );
}
