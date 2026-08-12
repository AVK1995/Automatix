import { prisma } from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state'); // In a real app, verify a signed JWT or secure session cookie here
  const error = searchParams.get('error');

  if (error) {
    return new Response(`OAuth Error: ${error}`, { status: 400 });
  }

  if (!code || !stateParam) {
    return new Response('Missing code or state parameter', { status: 400 });
  }

  const [userId, providerName = 'gmail'] = stateParam.split(':');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return new Response(`Failed to exchange token: ${errText}`, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    // Note: refresh_token is only provided on the first authorization (prompt=consent)
    // We will store both in our DB. In this prototype, we'll store them in a JSON string in apiKey or a new field.
    // Since our schema uses 'apiKey', we'll store the access_token there for now, 
    // but ideally we'd store a JSON object if we had a dedicated 'credentials' JSON field.
    const credentialsJson = JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    });

    // 2. Fetch user profile to get email
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profileResponse.ok) {
      return new Response('Failed to fetch Google profile', { status: 400 });
    }

    const profileData = await profileResponse.json();
    const accountEmail = profileData.email;
    const accountName = profileData.name || accountEmail;

    // 3. Check Limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user.role !== 'ADMIN' && providerName === 'gmail') {
      const currentCount = await prisma.integration.count({
        where: {
          clientId: userId,
          providerName: providerName
        }
      });

      if (currentCount >= 5) {
        return new Response(`
          <html>
            <body>
              <h2>Connection Failed</h2>
              <p>You have reached the maximum limit of 5 Gmail accounts. Please upgrade your plan or contact support.</p>
              <script>
                if (window.opener) {
                  // Notify parent window of error
                  window.opener.postMessage({ type: 'automatix_oauth_error', message: 'Limit reached' }, '*');
                }
              </script>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html' } });
      }
    }

    // 4. Save to database
    await prisma.integration.upsert({
      where: {
        clientId_providerName_accountEmail: {
          clientId: userId,
          providerName: providerName,
          accountEmail: accountEmail
        }
      },
      update: {
        apiKey: credentialsJson,
        name: accountName
      },
      create: {
        clientId: userId,
        providerName: providerName,
        name: accountName,
        accountEmail: accountEmail,
        apiKey: credentialsJson
      }
    });

    // 4. Return success HTML to close the popup
    return new Response(`
      <html>
        <body>
          <h2>Connection Successful!</h2>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              // Notify parent window
              window.opener.postMessage('automatix_oauth_success', '*');
              window.close();
            } else {
              window.location.href = '/dashboard';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
