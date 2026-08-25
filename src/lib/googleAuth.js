import { prisma } from '@/lib/prisma';
import { GoogleAuth } from 'google-auth-library';

export async function getGoogleAccessToken(connectionId = null, userId = null) {
  let accessToken = null;

  // 1. Explicit connection ID
  if (connectionId) {
    const connection = await prisma.integration.findUnique({
      where: { id: connectionId }
    });
    if (connection?.apiKey) {
      try {
        const parsed = JSON.parse(connection.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
        else accessToken = connection.apiKey;
      } catch (e) {
        accessToken = connection.apiKey;
      }
    }
  }

  // 2. Service Account Credentials from .env
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!accessToken && serviceAccountEmail && privateKeyRaw) {
    try {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      const auth = new GoogleAuth({
        credentials: {
          client_email: serviceAccountEmail,
          private_key: privateKey
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      accessToken = tokenResponse?.token;
    } catch (e) {
      console.error('Service Account Auth Error in getGoogleAccessToken:', e);
    }
  }

  // 3. User's Google Connection Fallback
  if (!accessToken && userId) {
    const userConn = await prisma.integration.findFirst({
      where: { 
        userId: userId,
        providerName: { in: ['google', 'sheets'] }
      }
    });
    if (userConn?.apiKey) {
      try {
        const parsed = JSON.parse(userConn.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
        else accessToken = userConn.apiKey;
      } catch (e) {
        accessToken = userConn.apiKey;
      }
    }
  }

  // 4. Global first Google Connection Fallback
  if (!accessToken) {
    const globalConn = await prisma.integration.findFirst({
      where: { providerName: { in: ['google', 'sheets'] } }
    });
    if (globalConn?.apiKey) {
      try {
        const parsed = JSON.parse(globalConn.apiKey);
        if (parsed.access_token) accessToken = parsed.access_token;
        else accessToken = globalConn.apiKey;
      } catch (e) {
        accessToken = globalConn.apiKey;
      }
    }
  }

  return accessToken;
}
