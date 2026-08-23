import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { GoogleAuth } from 'google-auth-library';
import { decrypt } from '@/lib/encryption';
import { NODE_TYPES, SYSTEM_STATUS } from "@/constants";

// This cron job runs every minute to poll active Google Sheets triggers
export const pollGoogleSheets = inngest.createFunction(
  { 
    id: "poll-google-sheets", 
    name: "Poll Google Sheets"
  },
  { cron: "* * * * *" },
  async ({ step }) => {
    
    // 1. Find all active workflows that have a Google Sheets Trigger configured for Polling
    const activeWorkflows = await step.run("Fetch Active Workflows", async () => {
      const wfs = await prisma.workflow.findMany({
        where: { isActive: true }
      });
      return wfs.filter(wf => {
        const nodes = Array.isArray(wf.nodesJson) ? wf.nodesJson : [];
        const trigger = nodes.find(n => n.type === NODE_TYPES.TRIGGER || n.type === 'trigger');
        return trigger?.integration?.id === 'sheets_trigger' && trigger.config?.method === 'polling' && trigger.config?.spreadsheetId;
      });
    });

    if (activeWorkflows.length === 0) return { polled: 0 };

    // 2. We need a system service account or we need to look up a BYOK for each.
    // For simplicity, we assume the system service account is used unless BYOK is selected.
    
    // In production, we'd batch these, but for now we iterate
    for (const wf of activeWorkflows) {
      await step.run(`Poll Sheet for Workflow ${wf.id}`, async () => {
        const nodes = Array.isArray(wf.nodesJson) ? wf.nodesJson : [];
        const trigger = nodes.find(n => n.type === NODE_TYPES.TRIGGER || n.type === 'trigger');
        const config = trigger.config;

        try {
          // Initialize auth
          const auth = new GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
              private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });
          const client = await auth.getClient();
          const accessToken = (await client.getAccessToken()).token;

          // Fetch the sheet (just the last 10 rows to be efficient)
          const targetSheetName = config.sheetName || 'Sheet1';
          const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(targetSheetName)}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          
          if (!getRes.ok) return; // Skip if failing (e.g. no access)

          const data = await getRes.json();
          const rows = data.values || [];
          if (rows.length <= 1) return; // Only headers or empty

          // We need to track the "last processed row index" in the database.
          // For now, if we don't have a dedicated state table for this, we can store it in the workflow's state or integration.
          // In a full implementation, we'd compare rows.length to a `lastPolledRowCount` stored in DB,
          // and if rows.length > lastPolledRowCount, we trigger the workflow for the new rows.

          // *Simplified for implementation plan preview*:
          console.log(`Polled ${wf.id}, found ${rows.length} rows.`);

        } catch (error) {
          console.error(`Failed polling for workflow ${wf.id}:`, error);
        }
      });
    }

    return { polled: activeWorkflows.length };
  }
);
