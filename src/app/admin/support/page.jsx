import GlobalSupportTicketsClient from '@/components/admin/GlobalSupportTicketsClient';

export default function GlobalSupportTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Live Support & Client Chat</h1>
        <p className="text-sm text-text-secondary">
          Monitor incoming support tickets, live client chats, and initiate direct conversations with tenants.
        </p>
      </div>

      <GlobalSupportTicketsClient />
    </div>
  );
}
