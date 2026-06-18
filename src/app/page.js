import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-8">
      <div className="w-full max-w-2xl bg-card border border-border-subtle rounded-sm p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Automatix Engine</h1>
        <p className="text-text-secondary mb-6">
          Webhook, Marketing, and Chat Automation system initialized.
        </p>
        
        <div className="flex gap-4">
          <Link href="/admin">
            <button className="bg-accent-violet hover:opacity-90 text-white px-4 py-2 rounded-sm font-medium transition-opacity cursor-pointer">
              Open Admin Dashboard
            </button>
          </Link>
          <Link href="/pricing">
            <button className="bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm font-medium transition-opacity cursor-pointer">
              View Pricing & Plans
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
