/**
 * Supabase Database Webhook → Notificaciones Telegram en tiempo real
 *
 * Supabase llama a este endpoint cuando hay cambios en las tablas:
 * - clients (INSERT) → "Nuevo cliente creado"
 * - tasks (INSERT, UPDATE) → "Tarea creada / completada / vencida"
 * - calendar_events (INSERT) → "Evento agendado"
 * - opportunities (UPDATE) → "Oportunidad movida de etapa"
 *
 * Configuración en Supabase Dashboard:
 *   Database → Webhooks → Create webhook
 *   URL: https://crm.elitorsoluciones.es/api/webhooks/supabase
 *   Method: POST
 *   Headers: { "x-webhook-secret": "<SUPABASE_WEBHOOK_SECRET>" }
 *
 * Añadir en Vercel env vars:
 *   SUPABASE_WEBHOOK_SECRET=<un string aleatorio seguro>
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

// Obtener el telegram_id de un usuario CRM
async function getTelegramId(
  supabase: ReturnType<typeof getAdminClient>,
  crmUserId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('telegram_users')
    .select('telegram_id')
    .eq('crm_user_id', crmUserId)
    .eq('active', true)
    .single();
  return data?.telegram_id || null;
}

// Tipos de payload de Supabase webhooks
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

export async function POST(req: Request) {
  // Verificar secret
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

  // Siempre 200 — Supabase reintenta si no recibe 2xx
  return NextResponse.json({ ok: true });
}

async function handleWebhook(
  supabase: ReturnType<typeof getAdminClient>,
  type: string,
  table: string,
  record: Record<string, any>,
  old_record: Record<string, any> | null
) {
  // Determinar el owner del registro para saber a quién notificar
  const ownerId =
    record.owner_id ||
    record.assigned_to ||
    record.created_by ||
    record.user_id ||
    null;

  if (!ownerId) return;

  // Solo notificar si la acción viene de la WEB (no de Telegram para evitar loops)
  const origin = record.origin || record.source || '';
  if (origin === 'telegram') return;

  const chatId = await getTelegramId(supabase, ownerId);
  if (!chatId) return;

  const message = buildNotificationMessage(type, table, record, old_record);
  if (!message) return;

  await sendTelegramMessage(chatId, message);
}

function buildNotificationMessage(
  type: string,
  table: string,
  record: Record<string, any>,
  old_record: Record<string, any> | null
): string | null {

  // ── CLIENTES ──
  if (table === 'clients' && type === 'INSERT') {
    const name = `${record.first_name || ''} ${record.last_name || ''}`.trim();
    const company = record.company ? ` de *${record.company}*` : '';
    return `👤 *Nuevo cliente creado*\n${name}${company} ha sido añadido al CRM.`;
  }

  // ── TAREAS ──
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

    // Tarea completada
    if (oldStatus === 'pendiente' && newStatus === 'completada') {
      return `✅ *Tarea completada*\n${record.title}`;
    }

    // Tarea reactivada
    if (oldStatus === 'completada' && newStatus === 'pendiente') {
      return `🔄 *Tarea reactivada*\n${record.title}`;
    }

    return null; // No notificar otros updates de tareas
  }

  // ── CALENDARIO ──
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

  // ── OPORTUNIDADES ──
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
      const icon = newStage === 'Ganado' ? '🏆'
        : newStage === 'Perdido' ? '❌'
        : '📊';
      return `${icon} *Oportunidad actualizada*\n*${record.title}*\n${oldStage} → *${newStage}*`;
    }
    return null;
  }

  // ── ACTIVIDADES ──
  if (table === 'activities' && type === 'INSERT') {
    // Solo notificar actividades importantes, no las automáticas del sistema
    if (record.origin === 'system') return null;

    const icon = record.type === 'Llamada' ? '📞'
      : record.type === 'Email' ? '📧'
      : record.type === 'Reunión' ? '👥'
      : '📝';

    return `${icon} *Nueva actividad registrada*\n${record.description?.substring(0, 100) || ''}`;
  }

  return null;
}
