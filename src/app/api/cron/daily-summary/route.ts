/**
 * Cron: Daily Summary + Alertas
 * Se ejecuta cada mañana a las 8:00 (Europe/Madrid)
 *
 * Envía por Telegram a cada usuario activo:
 * - Resumen de tareas vencidas
 * - Tareas para hoy
 * - Reuniones del día
 * - Clientes sin actividad en más de 7 días
 *
 * Configurado en vercel.json como cron job.
 * Protegido con CRON_SECRET para evitar llamadas no autorizadas.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram/handler';

// Cliente admin de Supabase (bypasa RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: Request) {
  // Protección: solo Vercel Cron puede llamar a este endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminClient();
  const todayISO = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  const nowISO = new Date().toISOString();

  try {
    // 1. Obtener todos los usuarios activos con Telegram vinculado
    const { data: telegramUsers, error: tuError } = await supabase
      .from('telegram_users')
      .select('telegram_id, crm_user_id')
      .eq('active', true);

    if (tuError || !telegramUsers?.length) {
      console.log('No hay usuarios de Telegram activos');
      return NextResponse.json({ ok: true, sent: 0 });
    }

    let sent = 0;

    for (const tu of telegramUsers) {
      const userId = tu.crm_user_id;
      const chatId = tu.telegram_id;

      try {
        const message = await buildDailySummary(supabase, userId, todayISO, nowISO);
        if (message) {
          await sendTelegramMessage(chatId, message);
          sent++;
        }
      } catch (err) {
        console.error(`Error enviando resumen a ${chatId}:`, err);
      }
    }

    console.log(`Cron daily-summary: enviados ${sent} mensajes`);
    return NextResponse.json({ ok: true, sent });

  } catch (err) {
    console.error('Error en cron daily-summary:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function buildDailySummary(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  todayISO: string,
  nowISO: string
): Promise<string | null> {
  const sections: string[] = [];

  // ── 1. Tareas vencidas ──
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('title, due_date, priority')
    .eq('assigned_to', userId)
    .eq('status', 'pendiente')
    .lt('due_date', todayISO)
    .order('due_date', { ascending: true })
    .limit(5);

  if (overdueTasks?.length) {
    const lines = overdueTasks.map((t) => {
      const daysAgo = Math.floor(
        (new Date(todayISO).getTime() - new Date(t.due_date).getTime()) / 86400000
      );
      const ago = daysAgo === 1 ? 'ayer' : `hace ${daysAgo} días`;
      return `• ${t.title} _(venció ${ago})_`;
    });
    sections.push(`⚠️ *Tareas vencidas (${overdueTasks.length}):*\n${lines.join('\n')}`);
  }

  // ── 2. Tareas para hoy ──
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('title, priority')
    .eq('assigned_to', userId)
    .eq('status', 'pendiente')
    .eq('due_date', todayISO)
    .order('priority', { ascending: false })
    .limit(5);

  if (todayTasks?.length) {
    const lines = todayTasks.map((t) => {
      const icon = t.priority === 'Alta' ? '🔴' : t.priority === 'Media' ? '🟡' : '🟢';
      return `${icon} ${t.title}`;
    });
    sections.push(`📋 *Tareas para hoy (${todayTasks.length}):*\n${lines.join('\n')}`);
  }

  // ── 3. Reuniones del día ──
  const todayStart = `${todayISO}T00:00:00`;
  const todayEnd = `${todayISO}T23:59:59`;

  const { data: todayEvents } = await supabase
    .from('calendar_events')
    .select('title, start_at, type')
    .eq('owner_id', userId)
    .gte('start_at', todayStart)
    .lte('start_at', todayEnd)
    .order('start_at', { ascending: true })
    .limit(5);

  if (todayEvents?.length) {
    const lines = todayEvents.map((e) => {
      const time = new Date(e.start_at).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
      });
      const icon = e.type === 'llamada' ? '📞' : e.type === 'reunion' ? '👥' : '📅';
      return `${icon} ${time} — ${e.title}`;
    });
    sections.push(`📅 *Agenda de hoy (${todayEvents.length}):*\n${lines.join('\n')}`);
  }

  // ── 4. Clientes sin actividad en +7 días ──
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const { data: inactiveClients } = await supabase
    .from('clients')
    .select(`
      id, first_name, last_name, company,
      activities(created_at)
    `)
    .eq('owner_id', userId)
    .eq('status', 'Nuevo')
    .limit(20);

  const inactive = (inactiveClients || []).filter((c) => {
    const acts = c.activities as any[];
    if (!acts?.length) return true; // Sin actividad nunca
    const lastActivity = Math.max(...acts.map((a) => new Date(a.created_at).getTime()));
    return lastActivity < sevenDaysAgo.getTime();
  }).slice(0, 3);

  if (inactive.length) {
    const lines = inactive.map((c) => {
      const name = `${c.first_name} ${c.last_name || ''}`.trim();
      const company = c.company ? ` — ${c.company}` : '';
      return `• ${name}${company}`;
    });
    sections.push(`😴 *Sin actividad +7 días (${inactive.length}):*\n${lines.join('\n')}`);
  }

  // Si no hay nada relevante, no enviar mensaje
  if (sections.length === 0) return null;

  const dateLabel = new Date(todayISO).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return `🌅 *Buenos días — ${dateLabel}*\n\n${sections.join('\n\n')}`;
}
