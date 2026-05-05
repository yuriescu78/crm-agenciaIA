import { NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/google';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.refresh_token) {
      // If we don't get a refresh token, it means the user was already authenticated.
      // We might want to tell them to disconnect first or handle this.
      console.warn('No refresh token received. User might already be authorized.');
    }

    // Save to database
    // We store it for the specific agency email we are using
    const { error } = await supabaseAdmin
      .from('google_tokens')
      .upsert({
        account_email: 'elitoragenciaia@gmail.com',
        refresh_token: tokens.refresh_token || '', // Handle cases where it's not sent again
        updated_at: new Date().toISOString(),
      }, { onConflict: 'account_email' });

    if (error) throw error;

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
          <div style="text-align: center; background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #3b82f6;">¡Conectado con éxito!</h1>
            <p>NexusCRM ya tiene permiso para usar tu Google Calendar y Drive.</p>
            <p style="font-size: 0.8rem; color: #94a3b8;">Puedes cerrar esta pestaña y volver al CRM.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('Error in Google Callback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
