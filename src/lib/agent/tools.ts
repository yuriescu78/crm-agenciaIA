/**
 * CRM Agent Tools - AI SDK v6 FINAL
 * Usa tool() con inputSchema: zodSchema() — API correcta del AI SDK v6.
 */

import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import { normalizeToolParams } from './normalizer';
import type { ToolContext } from '@/lib/llm/types';

async function logActivity(
  supabase: ReturnType<typeof createSupabaseClientForUser>,
  ctx: ToolContext,
  params: { clientId?: string | null; opportunityId?: string | null; type: string; description: string }
) {
  try {
    await supabase.from('activities').insert({
      client_id: params.clientId || null,
      opportunity_id: params.opportunityId || null,
      type: params.type,
      description: params.description,
      origin: 'telegram',
      created_by: ctx.crmUserId,
    });
  } catch (err) {
    console.error('Error registrando actividad:', err);
  }
}

function sanitizeSearch(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&').trim();
}

function normalizeEventType(raw: string): string {
  const t = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const map: Record<string, string> = {
    reunion: 'reunion', llamada: 'llamada', propuesta: 'propuesta',
    recordatorio: 'recordatorio', vencimiento: 'vencimiento',
  };
  return map[t] || 'reunion';
}

export function buildCrmTools(ctx: ToolContext) {
  const supabase = createSupabaseClientForUser(ctx.crmUserId);

  return {

    search_clients: tool({
      description: 'Busca clientes por nombre, email o empresa. Param: query.',
      inputSchema: zodSchema(z.object({
        query: z.string().describe('Texto a buscar'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('search_clients', rawArgs);
        const safe = sanitizeSearch(args.query || '');
        if (!safe) return { error: 'Indica qué cliente buscar.' };
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .eq('owner_id', ctx.crmUserId)
          .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(5);
        if (error) return { error: error.message };
        return { clients: data, count: data?.length || 0 };
      },
    }),

    list_clients: tool({
      description: 'Lista los clientes más recientes del CRM.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .eq('owner_id', ctx.crmUserId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) return { error: error.message };
        return { clients: data };
      },
    }),

    create_client: tool({
      description: 'Crea un nuevo cliente. Params: first_name (nombre), last_name, company (empresa), email, phone.',
      inputSchema: zodSchema(z.object({
        first_name: z.string().describe('Nombre del cliente'),
        last_name: z.string().optional().describe('Apellido'),
        company: z.string().optional().describe('Empresa'),
        email: z.string().optional().describe('Email'),
        phone: z.string().optional().describe('Teléfono'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_client', rawArgs);
        if (!args.first_name) return { error: 'Falta el nombre.' };
        const { data, error } = await supabase
          .from('clients')
          .insert({
            first_name: args.first_name,
            last_name: args.last_name || null,
            company: args.company || '',
            email: args.email || null,
            phone: args.phone || null,
            status: 'Nuevo',
            owner_id: ctx.crmUserId,
          })
          .select().single();
        if (error) return { error: error.message };
        await logActivity(supabase, ctx, {
          clientId: data.id, type: 'Telegram',
          description: `Cliente creado desde Telegram: ${args.first_name} ${args.last_name || ''} ${args.company ? `(${args.company})` : ''}`.trim(),
        });
        return { client: { name: `${data.first_name} ${data.last_name}`.trim(), company: data.company }, message: 'Cliente creado correctamente' };
      },
    }),

    create_task: tool({
      description: 'Crea una tarea. Params: title (obligatorio), description, priority (Alta/Media/Baja), client_id, due_date (YYYY-MM-DD).',
      inputSchema: zodSchema(z.object({
        title: z.string().describe('Título de la tarea'),
        description: z.string().optional(),
        priority: z.string().optional().describe('Alta, Media o Baja'),
        client_id: z.string().optional().describe('UUID del cliente'),
        due_date: z.string().optional().describe('Fecha límite YYYY-MM-DD'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_task', rawArgs);
        if (!args.title) return { error: 'Falta el título.' };
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: args.title,
            description: args.description || '',
            priority: args.priority || 'Media',
            status: 'Pendiente',
            client_id: args.client_id || null,
            due_date: args.due_date || null,
            assigned_to: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select().single();
        if (error) return { error: error.message };
        if (args.client_id) {
          await logActivity(supabase, ctx, { clientId: args.client_id, type: 'Tarea creada', description: `Tarea creada desde Telegram: "${args.title}"` });
        }
        return { task: { title: data.title, priority: data.priority, due_date: data.due_date }, message: 'Tarea creada correctamente' };
      },
    }),

    list_tasks: tool({
      description: 'Lista tareas pendientes. Params opcionales: today (true), urgent (true).',
      inputSchema: zodSchema(z.object({
        today: z.string().optional().describe('true para tareas de hoy'),
        urgent: z.string().optional().describe('true para urgentes'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_tasks', rawArgs);
        const isToday = args.today === true || args.today === 'true';
        const isUrgent = args.urgent === true || args.urgent === 'true';
        let query = supabase
          .from('tasks')
          .select('id, title, status, priority, due_date, clients(first_name, last_name)')
          .eq('assigned_to', ctx.crmUserId)
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(10);
        if (isToday) {
          const s = new Date(); s.setHours(0, 0, 0, 0);
          const e = new Date(); e.setHours(23, 59, 59, 999);
          query = query.gte('due_date', s.toISOString()).lte('due_date', e.toISOString());
        }
        if (isUrgent) query = query.eq('priority', 'Alta');
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { tasks: data, count: data?.length || 0 };
      },
    }),

    complete_task: tool({
      description: 'Marca una tarea como completada. Param: task_id (UUID).',
      inputSchema: zodSchema(z.object({
        task_id: z.string().describe('UUID de la tarea'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('complete_task', rawArgs);
        const taskId = args.task_id || args.taskId;
        if (!taskId) return { error: 'Falta el ID de la tarea.' };
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'Completada', completed_at: new Date().toISOString() })
          .eq('id', taskId)
          .select('id, title, client_id').single();
        if (error) return { error: error.message };
        if (data.client_id) {
          await logActivity(supabase, ctx, { clientId: data.client_id, type: 'Tarea completada', description: `Tarea completada desde Telegram: "${data.title}"` });
        }
        return { task: { title: data.title }, message: 'Tarea completada' };
      },
    }),

    get_agenda: tool({
      description: 'Eventos del calendario para una fecha. Param: date (YYYY-MM-DD).',
      inputSchema: zodSchema(z.object({
        date: z.string().describe('Fecha YYYY-MM-DD'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('get_agenda', rawArgs);
        if (!args.date) return { error: 'Falta la fecha.' };
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, type, start_at, end_at, status, clients(first_name, last_name)')
          .eq('owner_id', ctx.crmUserId)
          .gte('start_at', `${args.date}T00:00:00`)
          .lt('start_at', `${args.date}T23:59:59`)
          .order('start_at');
        if (error) return { error: error.message };
        return { events: data, count: data?.length || 0 };
      },
    }),

    create_event: tool({
      description: 'Crea un evento/reunión. Params: title (obligatorio), start_at (ISO 8601, obligatorio), end_at, description, type (reunion/llamada/propuesta/recordatorio/vencimiento), client_id.',
      inputSchema: zodSchema(z.object({
        title: z.string().describe('Título del evento'),
        start_at: z.string().describe('Inicio ISO 8601 (ej: 2026-05-11T10:00:00)'),
        end_at: z.string().optional().describe('Fin ISO 8601'),
        description: z.string().optional(),
        type: z.string().optional().describe('reunion, llamada, propuesta, recordatorio, vencimiento'),
        client_id: z.string().optional().describe('UUID del cliente'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_event', rawArgs);
        const title = args.title;
        const startAt = args.start_at || args.startAt;
        if (!title) return { error: 'Falta el título del evento.' };
        if (!startAt) return { error: 'Falta la fecha/hora de inicio.' };

        const endAt = args.end_at || args.endAt || (() => {
          const d = new Date(startAt);
          d.setHours(d.getHours() + 1);
          return d.toISOString();
        })();

        const clientId = args.client_id || args.clientId || null;
        const eventType = normalizeEventType(args.type || 'reunion');

        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            title,
            description: args.description || '',
            type: eventType,
            start_at: startAt,
            end_at: endAt,
            status: 'programado',
            client_id: clientId,
            owner_id: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select().single();

        if (error) {
          console.error('Error insertando calendar_event:', error);
          return { error: `No se pudo crear el evento: ${error.message}` };
        }

        if (clientId) {
          await logActivity(supabase, ctx, {
            clientId, type: 'Reunión',
            description: `Reunión agendada desde Telegram: "${title}" el ${startAt}`,
          });
        }

        try {
          const { syncEventToGoogle } = await import('@/lib/google/calendar');
          const googleSync = await syncEventToGoogle({ title, description: args.description, startAt, endAt });
          return {
            event: { title: data.title, start: data.start_at },
            message: googleSync ? '✅ Evento creado y sincronizado con Google Calendar' : '✅ Evento creado en el CRM',
          };
        } catch (googleError) {
          console.error('Error sync Google Calendar:', googleError);
          return { event: { title: data.title, start: data.start_at }, message: '✅ Evento creado en el CRM' };
        }
      },
    }),

    list_opportunities: tool({
      description: 'Lista oportunidades del pipeline. Param opcional: stage.',
      inputSchema: zodSchema(z.object({
        stage: z.string().optional().describe('Etapa para filtrar'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_opportunities', rawArgs);
        let query = supabase
          .from('opportunities')
          .select('id, title, stage, estimated_value, probability, clients(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(10);
        if (args.stage) query = query.eq('stage', args.stage);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { opportunities: data, count: data?.length || 0 };
      },
    }),

    create_opportunity: tool({
      description: 'Crea una oportunidad. Params: title (obligatorio), stage, client_id, estimated_value.',
      inputSchema: zodSchema(z.object({
        title: z.string().describe('Título'),
        stage: z.string().optional(),
        client_id: z.string().optional(),
        estimated_value: z.string().optional(),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_opportunity', rawArgs);
        if (!args.title) return { error: 'Falta el título.' };
        const clientId = args.client_id || args.clientId || null;
        const value = args.estimated_value || args.estimatedValue;
        const { data, error } = await supabase
          .from('opportunities')
          .insert({
            title: args.title,
            stage: args.stage || 'Contacto Inicial',
            client_id: clientId,
            assigned_to: ctx.crmUserId,
            estimated_value: value ? Number(value) : null,
          })
          .select().single();
        if (error) return { error: error.message };
        if (clientId) {
          await logActivity(supabase, ctx, { clientId, opportunityId: data.id, type: 'Telegram', description: `Oportunidad creada: "${args.title}"` });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: 'Oportunidad creada' };
      },
    }),

    update_opportunity_stage: tool({
      description: 'Cambia la etapa de una oportunidad. Params: opportunity_id (UUID), stage.',
      inputSchema: zodSchema(z.object({
        opportunity_id: z.string().describe('UUID de la oportunidad'),
        stage: z.string().describe('Nueva etapa'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('update_opportunity_stage', rawArgs);
        const oppId = args.opportunity_id || args.opportunityId;
        if (!oppId || !args.stage) return { error: 'Faltan datos.' };
        const { data: prev } = await supabase.from('opportunities').select('title, stage, client_id').eq('id', oppId).single();
        const { data, error } = await supabase.from('opportunities').update({ stage: args.stage }).eq('id', oppId).select().single();
        if (error) return { error: error.message };
        if (prev?.client_id) {
          await logActivity(supabase, ctx, {
            clientId: prev.client_id, opportunityId: oppId, type: 'Cambio de estado',
            description: `"${prev.title}" movida de "${prev.stage}" a "${args.stage}" desde Telegram`,
          });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: `Oportunidad movida a: ${args.stage}` };
      },
    }),

    get_daily_summary: tool({
      description: 'Resumen ejecutivo del día: clientes, tareas, reuniones y urgencias.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const [c, t, e, u, o] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', ctx.crmUserId).gte('due_date', todayStart.toISOString()).lte('due_date', todayEnd.toISOString()).neq('status', 'Completada'),
          supabase.from('calendar_events').select('id', { count: 'exact', head: true }).eq('owner_id', ctx.crmUserId).gte('start_at', todayStart.toISOString()).lte('start_at', todayEnd.toISOString()),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', ctx.crmUserId).eq('priority', 'Alta').neq('status', 'Completada'),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', ctx.crmUserId).lt('due_date', todayStart.toISOString()).neq('status', 'Completada'),
        ]);
        return {
          totalClients: c.count || 0, tasksToday: t.count || 0,
          eventsToday: e.count || 0, urgentTasks: u.count || 0, overdueTasks: o.count || 0,
          date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        };
      },
    }),

    delete_client: tool({
      description: 'Elimina un cliente (soft delete). SIEMPRE pide confirmación primero. Params: client_id, confirmed.',
      inputSchema: zodSchema(z.object({
        client_id: z.string().describe('UUID del cliente'),
        confirmed: z.string().optional().describe('true si confirmó'),
      })),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('delete_client', rawArgs);
        const clientId = args.client_id || args.clientId;
        if (!args.confirmed || args.confirmed === 'false') {
          return { requiresConfirmation: true, message: '⚠️ ¿Seguro? Responde "Sí, elimínalo" para confirmar.' };
        }
        const { data: client } = await supabase.from('clients').select('first_name, last_name, company').eq('id', clientId).single();
        const { error } = await supabase.from('clients').update({ status: 'Eliminado' }).eq('id', clientId);
        if (error) return { error: error.message };
        await logActivity(supabase, ctx, { clientId, type: 'Telegram', description: `Cliente eliminado: ${client?.first_name} ${client?.last_name}` });
        return { success: true, message: `Cliente ${client?.first_name} ${client?.last_name} eliminado.` };
      },
    }),

    list_notifications: tool({
      description: 'Lista notificaciones no leídas.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { data, error } = await supabase.from('notifications').select('id, title, message, type, created_at').eq('read', false).order('created_at', { ascending: false }).limit(5);
        if (error) return { error: error.message };
        return { notifications: data, count: data?.length || 0 };
      },
    }),

    mark_notifications_as_read: tool({
      description: 'Marca todas las notificaciones como leídas.',
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', ctx.crmUserId).eq('read', false);
        if (error) return { error: error.message };
        return { success: true, message: 'Notificaciones marcadas como leídas' };
      },
    }),

  };
}
