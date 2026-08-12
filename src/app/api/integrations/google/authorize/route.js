import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'gmail';

  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response('GOOGLE_CLIENT_ID is not configured in .env', { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;
  
  // We request drive.readonly to list spreadsheets, and spreadsheets to read/write sheets.
  // We also request email to identify the connected account.
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
  ].join(' ');

  // We pass user ID and provider joined by a colon.
  const state = `${session.user.id}:${provider}`; 

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent', // Force consent to guarantee we get a refresh_token
    state: state
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  redirect(authUrl);
}
