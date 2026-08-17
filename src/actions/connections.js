'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function getConnectionsByProvider(providerName) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const connections = await prisma.integration.findMany({
    where: {
      clientId: session.user.id,
      providerName: providerName.toLowerCase()
    },
    orderBy: { createdAt: 'desc' }
  });

  return connections.map(c => ({ 
    id: c.id, 
    providerName: c.providerName, 
    name: c.name,
    accountEmail: c.accountEmail,
    createdAt: c.createdAt 
  }));
}

export async function updateConnectionName(connectionId, newName) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.integration.update({
      where: {
        id: connectionId,
        clientId: session.user.id
      },
      data: {
        name: newName
      }
    });
    revalidatePath('/dashboard/connections');
    return { success: true };
  } catch (err) {
    console.error('Failed to update connection name:', err);
    return { success: false, error: 'Failed to update connection' };
  }
}

export async function getGoogleSheetConnections() {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Fetch BYOK connections saved in DB
  const dbConnections = await prisma.integration.findMany({
    where: {
      clientId: session.user.id,
      providerName: 'google-sheets-pseudo'
    },
    orderBy: { createdAt: 'desc' }
  });

  const sheets = dbConnections.map(c => ({
    id: c.id,
    name: c.name || 'Unknown Sheet Connection',
    type: 'byok'
  }));

  // Fetch unique pseudo-connections from workflows
  const workflows = await prisma.workflow.findMany({
    where: { clientId: session.user.id },
    select: { nodesJson: true }
  });

  const usedSheets = {};
  workflows.forEach(wf => {
    if (!wf.nodesJson) return;
    const nodes = typeof wf.nodesJson === 'string' ? JSON.parse(wf.nodesJson) : wf.nodesJson;
    nodes.forEach(node => {
      if ((node.integration?.id === 'sheets' || node.type === 'TRIGGER') && node.config?.spreadsheetId) {
        if (!usedSheets[node.config.spreadsheetId]) {
          usedSheets[node.config.spreadsheetId] = node.config.spreadsheetName || 'Unknown Sheet';
        }
      }
    });
  });

  Object.entries(usedSheets).forEach(([id, name]) => {
    // Avoid duplicates if a BYOK connection with same name/id exists (though IDs are different formats)
    sheets.push({ id, name, type: 'workflow_pseudo' });
  });

  // Deduplicate by name or ID just in case
  const uniqueSheets = [];
  const seenIds = new Set();
  sheets.forEach(s => {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueSheets.push(s);
    }
  });

  return uniqueSheets;
}

export async function getAllConnections() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const connections = await prisma.integration.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return connections.map(c => ({ 
    id: c.id, 
    providerName: c.providerName, 
    name: c.name,
    accountEmail: c.accountEmail,
    createdAt: c.createdAt 
  }));
}

export async function addByokConnection({ provider, name, email, privateKey }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  if (!email || !privateKey) {
    throw new Error('Email and key/password are required.');
  }

  // Encrypt the sensitive key before saving to the database
  const encryptedKey = encrypt(privateKey);

  const newConn = await prisma.integration.create({
    data: {
      clientId: session.user.id,
      providerName: provider,
      name: name || `${provider} BYOK Connection`,
      accountEmail: email,
      apiKey: 'BYOK_MODE', // Placeholder, the real secret is in privateKey
      privateKey: encryptedKey,
      clientEmail: email
    }
  });

  return { success: true, id: newConn.id };
}

export async function connectWithApiKey(providerName, connectionName, apiKey, providedEmail) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const normalizedProvider = providerName.toLowerCase();
  let accountEmail = '';
  let finalConnectionName = connectionName;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user.role !== 'ADMIN') {
    const currentCount = await prisma.integration.count({
      where: {
        clientId: session.user.id
      }
    });

    if (currentCount >= 5) {
      return { success: false, error: 'You have reached the maximum limit of 5 connections on the free plan. Please upgrade your plan to add more.' };
    }
  }

  try {
    if (normalizedProvider === 'calendly') {
      const response = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return { success: false, error: 'Invalid Calendly Personal Access Token.' };
      }
      
      const data = await response.json();
      accountEmail = data.resource?.email || '';
      // If the user didn't provide a custom name, use their actual name from Calendly
      if (!connectionName || connectionName === 'My Connection') {
        finalConnectionName = data.resource?.name || connectionName;
      }
    } else {
      // Mock for other providers temporarily if email not provided
      accountEmail = providedEmail || `owner.${connectionName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'unknown'}@${normalizedProvider}.com`;
    }

    if (!accountEmail) {
      return { success: false, error: 'Could not retrieve account email from provider.' };
    }

    const connection = await prisma.integration.upsert({
      where: {
        clientId_providerName_accountEmail: {
          clientId: session.user.id,
          providerName: normalizedProvider,
          accountEmail: accountEmail
        }
      },
      update: { 
        apiKey: apiKey,
        name: finalConnectionName
      },
      create: {
        clientId: session.user.id,
        providerName: normalizedProvider,
        name: finalConnectionName,
        accountEmail: accountEmail,
        apiKey: apiKey
      }
    });

    return { success: true, id: connection.id };
  } catch (err) {
    console.error('connectWithApiKey error:', err);
    return { success: false, error: 'Failed to verify API key.' };
  }
}

export async function testSmtpConnection(credentialString, testEmail) {
  try {
    const creds = JSON.parse(credentialString);
    const transporter = nodemailer.createTransport({
      host: creds.host,
      port: parseInt(creds.port),
      secure: creds.encryption?.toLowerCase() === 'ssl' || creds.port === '465',
      auth: {
        user: creds.username,
        pass: creds.password
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body, p, h1, h2, h3, h4, h5, h6 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
          .container { max-width: 600px; margin: 0 auto; background-color: #121214; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          .header { padding: 30px 30px; text-align: center; border-bottom: 1px solid #27272a; }
          .logo-text { font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; margin: 0; display: inline-block; vertical-align: middle; }
          .logo-svg { display: inline-block; vertical-align: middle; margin-right: 12px; filter: drop-shadow(0px 0px 8px rgba(255,255,255,0.3)); }
          .content { padding: 40px 30px; text-align: center; }
          
          /* Static 3D Checkmark (Email Client Safe) */
          .success-icon { display: block; margin: 0 auto 32px auto; width: 72px; height: 72px; background-color: #022c22; background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%); color: #22c55e; border-radius: 50%; font-size: 32px; line-height: 72px; text-align: center; border: 2px solid rgba(34,197,94,0.4); box-shadow: 0 8px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1); }
          
          .title { font-size: 24px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
          .text { font-size: 15px; color: #a1a1aa; line-height: 1.6; margin-bottom: 30px; }
          .footer { background-color: #0c0c0e; padding: 24px 30px; text-align: center; border-top: 1px solid #27272a; }
          .footer-text { font-size: 13px; color: #71717a; margin: 0; }
          @media only screen and (max-width: 600px) {
            .container { margin-top: 0; margin-bottom: 0; border-radius: 8px; }
            body { padding: 16px; }
          }
          
          /* Custom scrollbar for iframe preview */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #52525b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <svg class="logo-svg" viewBox="0 0 100 100" width="32" height="32">
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f8fafc" />
                  <stop offset="50%" stop-color="#cbd5e1" />
                  <stop offset="100%" stop-color="#64748b" />
                </linearGradient>
              </defs>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M41.5 15L15 90h18l7.5-22.5h20L67.5 90h18L58.5 15h-17zM45 45l5-15 5 15h-10z" fill="url(#logo-gradient)" />
            </svg>
            <h1 class="logo-text">Automatix</h1>
          </div>
          <div class="content">
            <div class="success-icon">✓</div>
            <h2 class="title">Connection Successful</h2>
            <p class="text">Your SMTP credentials have been successfully verified. Automatix is now fully authorized to send emails on your behalf.</p>
          </div>
          <div class="footer">
            <p class="footer-text">Powered by Automatix</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Automatix Testing" <${creds.username}>`,
      to: testEmail,
      subject: 'Automatix: SMTP Connection Successful',
      html: htmlContent
    });

    return { success: true, htmlContent };
  } catch (err) {
    console.error('SMTP Test Error:', err);
    return { success: false, error: err.message };
  }
}

export async function testSheetsConnection(email, privateKey, testSheetId) {
  try {
    const { JWT } = require('google-auth-library');
    // Ensure correct formatting of private key (replace literal \n with actual newline if needed)
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const client = new JWT({
      email: email,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Obtain access token
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error('Failed to generate access token from credentials.');
    }

    // Attempt to append a row
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${testSheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'A1',
        majorDimension: 'ROWS',
        values: [
          ['Automatix Test', 'Success', new Date().toISOString()]
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to append to spreadsheet. Check sharing permissions.');
    }

    return { success: true };
  } catch (err) {
    console.error('Sheets Test Error:', err);
    return { success: false, error: err.message };
  }
}

// Keeping saveConnection for backward compatibility or mock testing if needed
export async function saveConnection(providerName, connectionName = 'My Connection', dummyToken = 'oauth_token_xxx', providedEmail = '') {
  return connectWithApiKey(providerName, connectionName, dummyToken, providedEmail);
}

export async function deleteConnectionById(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const connection = await prisma.integration.findUnique({ where: { id } });
  if (!connection || connection.clientId !== session.user.id) throw new Error('Unauthorized');

  // Fetch all workflows for this user to check for dependencies
  const workflows = await prisma.workflow.findMany({
    where: { clientId: session.user.id }
  });

  for (const workflow of workflows) {
    let hasIssue = false;
    let issueNodeId = null;
    let isTriggerIssue = false;

    if (workflow.nodesJson && Array.isArray(workflow.nodesJson)) {
      const updatedNodes = [...workflow.nodesJson];
      
      for (const node of updatedNodes) {
        const matchesConnection = 
          (node.config && node.config.connectionId === id) || 
          node.integrationId === id || 
          node.integration?.id === id;

        if (matchesConnection) {
          hasIssue = true;
          issueNodeId = node.id;
          node.issue = 'Missing Connection';
          
          if (!node.config) node.config = {};
          node.config.deletedAccountEmail = connection.accountEmail;
          node.config.deletedProviderName = connection.providerName;
          
          if (node.type === 'trigger' || node.type === 'TRIGGER' || node.type === 'trigger_instagram') {
            isTriggerIssue = true;
          }
        }
      }

      if (hasIssue) {
        await prisma.workflow.update({
          where: { id: workflow.id },
          data: {
            nodesJson: updatedNodes,
            ...(isTriggerIssue ? { isActive: false } : {})
          }
        });

        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: session.user.id,
            type: 'WORKFLOW_ISSUE',
            message: `Connection deleted. Action required for workflow: ${workflow.name}`,
            metadata: { workflowId: workflow.id, nodeId: issueNodeId, isTriggerIssue }
          }
        });
      }
    }
  }

  await prisma.integration.delete({ where: { id } });
  return { success: true };
}

export async function deleteGlobalConnection(connectionId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Forbidden: Only Admins can delete global connections');
  }

  await prisma.integration.delete({
    where: { id: connectionId }
  });

  revalidatePath('/admin/connections');
  return { success: true };
}

export async function getIntegrationData(connectionId, dataType, options = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const connection = await prisma.integration.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.clientId !== session.user.id) {
    return { success: false, error: 'Connection not found or unauthorized' };
  }

  if (connection.providerName === 'calendly' && dataType === 'events') {
    try {
      const meRes = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!meRes.ok) throw new Error('Failed to fetch Calendly user');
      const meData = await meRes.json();
      const userUri = meData.resource.uri;

      const eventsRes = await fetch(`https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}`, {
        headers: {
          'Authorization': `Bearer ${connection.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!eventsRes.ok) throw new Error('Failed to fetch Calendly events');
      const eventsData = await eventsRes.json();

      return {
        success: true,
        data: eventsData.collection.map(event => ({
          id: event.uri,
          name: event.name,
          url: event.scheduling_url
        }))
      };
    } catch (err) {
      console.error('getIntegrationData Error:', err);
      return { success: false, error: 'Failed to fetch data from provider.' };
    }
  }

  if (connection.providerName === 'sheets') {
    try {
      let accessToken = connection.apiKey;
      try {
        const parsed = JSON.parse(connection.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
      } catch (e) {}

      if (dataType === 'spreadsheets') {
        const driveRes = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)", {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!driveRes.ok) throw new Error('Failed to fetch spreadsheets');
        const driveData = await driveRes.json();
        return {
          success: true,
          data: (driveData.files || []).map(file => ({
            id: file.id,
            name: file.name
          }))
        };
      } else if (dataType === 'sheets') {
        const { spreadsheetId } = options;
        if (!spreadsheetId) throw new Error('spreadsheetId is required to fetch sheets');
        
        const sheetsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!sheetsRes.ok) throw new Error('Failed to fetch sheets inside spreadsheet');
        const sheetsData = await sheetsRes.json();
        return {
          success: true,
          data: (sheetsData.sheets || []).map(s => ({
            id: s.properties.title, // sheet name is generally what we need for operations
            name: s.properties.title
          }))
        };
      }
    } catch (err) {
      console.error('getIntegrationData Error:', err);
      return { success: false, error: 'Failed to fetch data from provider.' };
    }
  }

  return { success: false, error: 'Unsupported provider or data type.' };
}
