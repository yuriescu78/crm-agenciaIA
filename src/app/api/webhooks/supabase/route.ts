/**
 * Supabase Database Webhook → Notificaciones Telegram en tiempo real
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/lib/telegram/handler';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getTelegramId(
  supabase: ReturnType<typeof getAdminClient>,
  crmUserId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('telegram_users')
    .select('telegram_user_id')
    .eq('user_id', crmUserId)
    .eq('active', true)
    .single();
  console.log('getTelegramId:', { crmUserId, data, error });
  return data?.telegram_user_id || null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { type, table, record, old_record } = payload;

  try {
    await handleWebhook(supabase, type, table, record, old_record);
  } catch (err) {
    console.error('Error procesando webhook:', err);
  }

  return NextResponse.json({ ok: true });
}

async function handleWebhook(
  supabase: ReturnType<typeof getAdminClient>,
  type: string,
  table: string,
  record: Record<string, any>,
  old_record: Record<string, any> | null
) {
  const ownerId =
    record.owner_id ||
    record.assigned_to ||
    record.created_by ||
    record.user_id ||
    null;

  console.log('Webhook recibido:', { type, table, ownerId, record });

  if (!ownerId) {
    console.log('No ownerId encontrado, ignorando');
    return;
  }

  const origin = record.origin || record.source || '';
  if (origin === 'telegram') {
    console.log('Origen telegram, ignorando para evitar loop');
    return;
  }

  const chatId = await getTelegramId(supabase, ownerId);
  if (!chatId) {
    console.log('No chatId encontrado para ownerId:', ownerId);
    return;
  }

  const message = buildNotificationMessage(type, table, record, old_record);
  if (!message) {
    console.log('No hay mensaje para este evento');
    return;
  }

  console.log('Enviando a Telegram:', { chatId, message: message.substring(0, 50) });
  await sendTelegramMessage(chatId, message);
}

function buildNotificationMessage(
  type: string,
  table: string,
  record: Record<string, any>,
  old_record: Record<string, any> | null
): string | null {

  if (table === 'clients' && type === 'INSERT') {
    const name = `${record.first_name || ''} ${record.last_name || ''}`.trim();
    const company = record.company ? ` de *${record.company}*` : '';
    return `👤 *Nuevo cliente creado*\n${name}${company} ha sido añadido al CRM.`;
  }

  if (table === 'tasks' && type === 'INSERT') {
    const priority = record.priority === 'Alta' ? '🔴' : record.priority === 'Media' ? '🟡' : '🟢';
    const due = record.due_date
      ? `\n📅 Vence: ${new Date(record.due_date).toLocaleDateString('es-ES')}`
      : '';
    return `${priority} *Nueva tarea creada*\n${record.title}${due}`;
  }

  if (table === 'tasks' && type === 'UPDATE') {
    const oldStatus = old_record?.status;
    const newStatus = record.status;
    if (oldStatus === 'pendiente' && newStatus === 'completada') {
      return `✅ *Tarea completada*\n${record.title}`;
    }
    if (oldStatus === 'completada' && newStatus === 'pendiente') {
      return `🔄 *Tarea reactivada*\n${record.title}`;
    }
    return null;
  }

  if (table === 'calendar_events' && type === 'INSERT') {
    const icon = record.type === 'llamada' ? '📞'
      : record.type === 'reunion' ? '👥'
      : record.type === 'propuesta' ? '📄'
      : record.type === 'recordatorio' ? '🔔'
      : '📅';
    const dateStr = record.start_at
      ? new Date(record.start_at).toLocaleString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long',
          hour: '2-digit', minute: '2-digit',
          timeZone: 'Europe/Madrid',
        })
      : '';
    return `${icon} *Evento agendado*\n*${record.title}*\n📅 ${dateStr}`;
  }

  if (table === 'calendar_events' && type === 'UPDATE') {
    const oldStatus = old_record?.status;
    const newStatus = record.status;
    if (oldStatus === 'programado' && newStatus === 'realizado') {
      return `✅ *Evento marcado como realizado*\n${record.title}`;
    }
    if (newStatus === 'cancelado') {
      return `❌ *Evento cancelado*\n${record.title}`;
    }
    return null;
  }

  if (table === 'opportunities' && type === 'INSERT') {
    const value = record.estimated_value
      ? ` — *${Number(record.estimated_value).toLocaleString('es-ES')}€*`
      : '';
    return `💼 *Nueva oportunidad*\n${record.title}${value}\n📊 Etapa: ${record.stage || 'Contacto Inicial'}`;
  }

  if (table === 'opportunities' && type === 'UPDATE') {
    const oldStage = old_record?.stage;
    const newStage = record.stage;
    if (oldStage !== newStage) {
      const icon = newStage === 'Ganado' ? '🏆' : newStage === 'Perdido' ? '❌' : '📊';
      return `${icon} *Oportunidad actualizada*\n*${record.title}*\n${oldStage} → *${newStage}*`;
    }
    return null;
  }

  if (table === 'activities' && type === 'INSERT') {
    if (record.origin === 'system') return null;
    const icon = record.type === 'Llamada' ? '📞'
      : record.type === 'Email' ? '📧'
      : record.type === 'Reunión' ? '👥'
      : '📝';
    return `${icon} *Nueva actividad registrada*\n${record.description?.substring(0, 100) || ''}`;
  }

  return null;
}
