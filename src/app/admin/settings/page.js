import { prisma } from '@/lib/prisma';
import DataTable from '@/components/DataTable';

export const dynamic = 'force-dynamic';

export default async function SystemSettingsPage() {
  // Fetch real integrations from the database
  const integrations = await prisma.integration.findMany({
    include: {
      client: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const connectionData = integrations.map(integration => ({
    id: integration.id,
    tenantName: integration.client?.name || integration.client?.email || 'Unknown',
    platform: integration.providerName,
    keyPreview: integration.apiKey ? `sk-${integration.platform?.substring(0, 3)?.toLowerCase() || 'key'}...${integration.apiKey.substring(integration.apiKey.length - 4)}` : '***',
    lastSync: new Date(integration.updatedAt || integration.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
  }));

  const connectionColumns = [
    { header: 'Tenant', accessor: (row) => <span className="font-medium text-foreground">{row.tenantName}</span> },
    { 
      header: 'Integration', 
      accessor: (row) => (
        <div className="flex items-center justify-center gap-2">
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
    { header: 'Last Updated', accessor: (row) => <span className="text-sm text-text-secondary">{row.lastSync}</span> },
  ];

  // Map real environment variables if they exist
  const globalConfigs = [];
  
  if (process.env.OPENAI_API_KEY) {
    globalConfigs.push({ name: 'OpenAI API', key: `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`, status: 'Operational' });
  }
  if (process.env.RESEND_API_KEY) {
    globalConfigs.push({ name: 'Resend Email', key: `re_...${process.env.RESEND_API_KEY.slice(-4)}`, status: 'Operational' });
  }
  if (process.env.STRIPE_SECRET_KEY) {
    globalConfigs.push({ name: 'Stripe Billing', key: `sk_...${process.env.STRIPE_SECRET_KEY.slice(-4)}`, status: 'Operational' });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    globalConfigs.push({ name: 'Anthropic Claude', key: `sk-ant-...${process.env.ANTHROPIC_API_KEY.slice(-4)}`, status: 'Operational' });
  }
  if (process.env.DATABASE_URL) {
    globalConfigs.push({ name: 'PostgreSQL Database', key: `postgres://...`, status: 'Operational' });
  }

  return (
    <div className="max-w-6xl space-y-12">
      
      {/* Global Engine Configuration */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Global Engine Configuration</h2>
          <p className="text-sm text-text-secondary">Master API keys and services used by the automation engine globally.</p>
        </div>
        
        {globalConfigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalConfigs.map((engine) => (
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
        ) : (
          <div className="p-8 border border-dashed border-border-subtle rounded-sm text-center text-sm text-text-secondary">
            No global API keys found in the environment variables.
          </div>
        )}
      </section>

      {/* Tenant Authorized Connections */}
      <section>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-foreground">Tenant Authorized Connections</h2>
          <p className="text-sm text-text-secondary">A unified view of all third-party integrations authorized by individual tenants.</p>
        </div>

        {connectionData.length > 0 ? (
          <DataTable data={connectionData} columns={connectionColumns} />
        ) : (
          <div className="p-8 border border-dashed border-border-subtle rounded-sm text-center text-sm text-text-secondary">
            No tenant connections found.
          </div>
        )}
      </section>

    </div>
  );
}
