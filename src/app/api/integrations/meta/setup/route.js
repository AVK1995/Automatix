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
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`);
    const pageData = await pageRes.json();
    
    if (pageData.error) {
      return NextResponse.json({ error: `Invalid Page Access Token: ${pageData.error.message}` }, { status: 400 });
    }
    
    const pageId = pageData.id;
    const pageName = pageData.name || connectionName;

    // 2. Generate App Access Token
    // Meta allows using the app_id|app_secret directly as the app access token for server-to-server calls
    const appAccessToken = `${appId}|${appSecret}`;

    // 3. Subscribe the App to the Webhook Endpoint
    const appSubRes = await fetch(`https://graph.facebook.com/v19.0/${appId}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: appAccessToken,
        object: 'page',
        callback_url: callbackUrl,
        fields: 'messages,messaging_postbacks,standby',
        verify_token: verifyToken,
      })
    });
    
    const appSubData = await appSubRes.json();
    if (appSubData.error) {
      console.error('App Subscription Error:', appSubData.error);
      return NextResponse.json({ error: `Failed to configure App Webhooks: ${appSubData.error.message}` }, { status: 400 });
    }

    // 4. Subscribe the Page to the App
    const pageSubRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: pageAccessToken,
        subscribed_fields: 'messages,messaging_postbacks,standby'
      })
    });
    
    const pageSubData = await pageSubRes.json();
    if (pageSubData.error) {
      console.error('Page Subscription Error:', pageSubData.error);
      return NextResponse.json({ error: `Failed to subscribe Page to App: ${pageSubData.error.message}` }, { status: 400 });
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
        apiKey: pageAccessToken, // The Page Access Token is needed for sending outgoing messages!
        privateKey: appSecret,
        clientEmail: appId // Repurposing clientEmail for App ID to avoid schema changes
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

    return NextResponse.json({ success: true, integrationId: integration.id, pageName });

  } catch (error) {
    console.error('Meta Setup API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
