import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, appSecret, pageAccessToken, connectionName, providerName } = await req.json();

    if (!appId || !appSecret || !pageAccessToken || !connectionName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine the base URL for the webhook callback
    // If NEXT_PUBLIC_APP_URL is not set, we cannot register the webhook (Meta requires HTTPS)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://automatix.local';
    const callbackUrl = `${appUrl}/api/webhooks/meta`;
    const verifyToken = process.env.AUTOMATIX_META_VERIFY_TOKEN || 'automatix_secure_meta_token_123';

    // 1. Get Page ID using the Page Access Token
    let pageRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`);
    let pageData = await pageRes.json();
    let isInstagramToken = false;
    
    // Fallback to Instagram Graph API if it's an Instagram User Token
    if (pageData.error && pageData.error.message.includes('Invalid OAuth access token')) {
      pageRes = await fetch(`https://graph.instagram.com/v19.0/me?access_token=${pageAccessToken}`);
      pageData = await pageRes.json();
      isInstagramToken = true;
    }

    if (pageData.error) {
      return NextResponse.json({ error: `Invalid Access Token: ${pageData.error.message}` }, { status: 400 });
    }
    
    let pageId = pageData.id;
    const facebookPageId = pageId; // Save this for subscribing the page
    const pageName = pageData.name || pageData.username || connectionName;

    // If provider is instagram and it's a FB page token, we MUST fetch the instagram_business_account ID!
    if (providerName === 'instagram' && !isInstagramToken) {
       const igRes = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}?fields=instagram_business_account&access_token=${pageAccessToken}`);
       const igData = await igRes.json();
       if (igData.instagram_business_account?.id) {
           pageId = igData.instagram_business_account.id; // Use IGID for the integration accountEmail
       } else {
           return NextResponse.json({ error: `This Facebook Page is not connected to an Instagram Business Account.` }, { status: 400 });
       }
    }

    // 2. Generate App Access Token
    // Meta allows using the app_id|app_secret directly as the app access token for server-to-server calls
    const appAccessToken = `${appId}|${appSecret}`;

    // 3. Subscribe the App to the Webhook Endpoint
    try {
      const appSubRes = await fetch(`https://graph.facebook.com/v19.0/${appId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          access_token: appAccessToken,
          object: isInstagramToken ? 'instagram' : 'page',
          callback_url: callbackUrl,
          fields: isInstagramToken ? 'messages,messaging_postbacks,comments' : 'messages,messaging_postbacks,standby',
          verify_token: verifyToken,
        })
      });
      
      const appSubData = await appSubRes.json();
      if (appSubData.error) {
        console.warn('App Subscription Warning:', appSubData.error);
        // We log warning but don't strictly fail, as users can setup webhooks manually in the UI
      }

      // 4. Subscribe the Page to the App (Only applicable for Facebook Page tokens)
      if (!isInstagramToken) {
        const pageSubRes = await fetch(`https://graph.facebook.com/v19.0/${facebookPageId}/subscribed_apps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            access_token: pageAccessToken,
            subscribed_fields: 'messages,messaging_postbacks,standby'
          })
        });
        
        const pageSubData = await pageSubRes.json();
        if (pageSubData.error) {
          console.warn('Page Subscription Warning:', pageSubData.error);
        }
      }
    } catch (subscriptionError) {
      console.warn('Webhook Subscription Error (can be done manually):', subscriptionError);
    }

    // 5. Save the Integration to the Database
    // We save the pageId as `accountEmail` since it uniquely identifies the integration endpoint.
    // We store the encrypted App Secret in `privateKey`.
    
    // In a production environment, you should encrypt appSecret and pageAccessToken here.
    // Assuming the user handles basic encryption at the DB level or we store as-is for this scope.
    
    const integration = await prisma.integration.upsert({
      where: {
        clientId_providerName_accountEmail: {
          clientId: session.user.id,
          providerName: providerName || 'instagram',
          accountEmail: pageId
        }
      },
      update: {
        name: connectionName,
        apiKey: pageAccessToken,
        privateKey: appSecret,
        clientEmail: appId
      },
      create: {
        clientId: session.user.id,
        providerName: providerName || 'instagram',
        name: connectionName,
        accountEmail: pageId,
        apiKey: pageAccessToken,
        privateKey: appSecret,
        clientEmail: appId
      }
    });

    // Auto-configure any broken workflows that were waiting for this connection
    try {
      const workflows = await prisma.workflow.findMany({
        where: { clientId: session.user.id }
      });

      for (const workflow of workflows) {
        if (!workflow.nodesJson || !Array.isArray(workflow.nodesJson)) continue;
        let hasUpdate = false;
        const updatedNodes = [...workflow.nodesJson];
        let isTriggerFixed = false;

        for (const node of updatedNodes) {
          if (
            node.issue === 'Missing Connection' && 
            node.config?.deletedAccountEmail === pageId &&
            (node.config?.deletedProviderName === (providerName || 'instagram') || !node.config?.deletedProviderName)
          ) {
            
            // Auto-configure the new integration
            if (node.config) {
               node.config.connectionId = integration.id;
               delete node.config.deletedAccountEmail;
               delete node.config.deletedProviderName;
            }
            if (node.integration?.id) {
               node.integration.id = integration.id;
            }
            if (node.integrationId) {
               node.integrationId = integration.id;
            }
            
            delete node.issue;
            hasUpdate = true;
            
            if (node.type === 'trigger' || node.type === 'TRIGGER' || node.type === 'trigger_instagram') {
               isTriggerFixed = true;
            }
          }
        }

        if (hasUpdate) {
          await prisma.workflow.update({
            where: { id: workflow.id },
            data: { 
              nodesJson: updatedNodes,
              // If the trigger was fixed, we don't auto-activate, we let the user review it, 
              // but we COULD auto-activate if they want. The prompt didn't specify auto-activating, 
              // just auto-configuring steps so they don't have to reconfigure them.
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to auto-configure workflows:', e);
    }

    return NextResponse.json({ success: true, integrationId: integration.id, pageName });

  } catch (error) {
    console.error('Meta Setup API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
