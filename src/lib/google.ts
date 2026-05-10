import { google } from 'googleapis';

// GOOGLE_REDIRECT_URI must be set explicitly in Vercel env vars
// e.g. https://crm.elitorsoluciones.es/api/auth/google/callback
export const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI
  || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: REDIRECT_URI, // pass explicitly — some googleapis versions require it
  });
};

export const getTokensFromCode = async (code: string) => {
  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
  return tokens;
};

export const getGoogleCalendarClient = (tokens: any) => {
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getAuthorizedCalendar = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('google_tokens')
    .select('refresh_token')
    .eq('account_email', 'elitoragenciaia@gmail.com')
    .single();

  if (error || !data) {
    console.error('Google integration error:', error);
    throw new Error('Google integration not configured');
  }

  if (!data.refresh_token) {
    throw new Error('Refresh token is missing in database');
  }

  // We ensure the client has the latest secret and ID from env
  oauth2Client.setCredentials({
    refresh_token: data.refresh_token
  });

  // Force a refresh check if needed or just return the client
  // The googleapis library will handle the refresh on the first request.
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const getGoogleDriveClient = (tokens: any) => {
  oauth2Client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: oauth2Client });
};
