import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';

export const dynamic = 'force-dynamic';

export default async function SystemSettingsPage() {
  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: { name: true, email: true }
  });

  // Generate fake connection data for demonstration purposes
  const dummyConnections = users.flatMap(user => {
    const platforms = ['Slack', 'Salesforce', 'HubSpot', 'Shopify', 'Notion', 'Gmail'];
    // Randomly pick 1 to 3 connections for each user
    const userPlatforms = platforms.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    
    return userPlatforms.map(platform => ({
      tenantName: user.name || user.email,
      platform,
      status: 'Connected',
      lastSync: new Date(Date.now() - Math.random() * 1000000000).toLocaleString(),
      keyPreview: `sk-${platform.substring(0, 3).toLowerCase()}...${Math.floor(Math.random() * 9999)}`
    }));
  });

  const connectionColumns = [
    { header: 'Tenant', accessor: (row) => <span className="font-medium text-foreground">{row.tenantName}</span> },
    { 
      header: 'Integration', 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-background border border-border-subtle flex items-center justify-center text-[10px] font-bold text-text-secondary">
            {row.platform.charAt(0)}
          </div>
          <span>{row.platform}</span>
        </div>
      ) 
    },
    { header: 'API Key / Token', accessor: (row) => <code className="text-xs bg-background px-2 py-1 rounded-sm border border-border-subtle font-mono text-text-secondary">{row.keyPreview}</code> },
    { 
      header: 'Status', 
      accessor: () => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20 uppercase tracking-wider">
          Active
        </span>
      ) 
    },
    { header: 'Last Sync', accessor: (row) => <span className="text-sm text-text-secondary">{row.lastSync}</span> },
  ];

  return (
    <div className="max-w-6xl space-y-12">
      
      {/* Global Engine Configuration */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Global Engine Configuration</h2>
          <p className="text-sm text-text-secondary">Master API keys used by the automation engine globally.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'OpenAI API', key: 'sk-proj-automatix-master-key...', status: 'Operational' },
            { name: 'Resend Email', key: 're_automatix_master_key...', status: 'Operational' },
            { name: 'Stripe Billing', key: 'sk_live_automatix_master_...', status: 'Operational' },
            { name: 'Anthropic Claude', key: 'sk-ant-api03-automatix...', status: 'Operational' },
          ].map((engine) => (
            <div key={engine.name} className="p-4 border border-border-subtle rounded-sm bg-card flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-foreground text-sm">{engine.name}</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-accent-blue">{engine.status}</span>
                </div>
              </div>
              <code className="text-xs text-text-secondary font-mono truncate">{engine.key}</code>
            </div>
          ))}
        </div>
      </section>

      {/* Tenant Authorized Connections */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Tenant Authorized Connections</h2>
          <p className="text-sm text-text-secondary">A unified view of all third-party integrations authorized by individual tenants.</p>
        </div>

        <DataTable data={dummyConnections} columns={connectionColumns} />
      </section>

    </div>
  );
}
