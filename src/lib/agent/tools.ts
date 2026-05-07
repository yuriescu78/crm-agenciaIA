/**
 * CRM Agent Tools (v3 - con normalización, auditoría y soft delete)
 * 
 * Arquitectura de 3 capas para tool calling en español:
 * 
 *   LLM genera tool call (puede usar campos en español)
 *       ↓
 *   Schema con .passthrough() acepta campos extra
 *       ↓
 *   execute() normaliza parámetros (español → inglés, fechas, enums)
 *       ↓
 *   Ejecución contra Supabase con campos correctos
 */

import { z } from 'zod';
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import { normalizeToolParams } from './normalizer';
import type { ToolContext } from '@/lib/llm/types';

async function logActivity(
  supabase: ReturnType<typeof createSupabaseClientForUser>,
  ctx: ToolContext,
  params: {
    clientId?: string | null;
    opportunityId?: string | null;
    type: string;
    description: string;
  }
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

export function buildCrmTools(ctx: ToolContext) {
  const supabase = createSupabaseClientForUser(ctx.crmUserId);

  return {

    search_clients: {
      description: 'Busca clientes por nombre, email o empresa',
      parameters: z.object({
        query: z.string().describe('Texto a buscar'),
        limit: z.number().optional().default(5),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('search_clients', rawArgs);
        const safe = sanitizeSearch(args.query || '');
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(args.limit || 5);
        if (error) return { error: error.message };
        return { clients: data, count: data?.length || 0 };
      },
    },

    list_clients: {
      description: 'Lista los clientes más recientes',
      parameters: z.object({
        limit: z.number().optional().default(10),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_clients', rawArgs);
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .order('created_at', { ascending: false })
          .limit(args.limit || 10);
        if (error) return { error: error.message };
        return { clients: data };
      },
    },

    create_client: {
      description: 'Crea un nuevo cliente. Campos: first_name (nombre), last_name (apellido), company (empresa), email, phone (teléfono).',
      parameters: z.object({
        first_name: z.string().optional().describe('Nombre del cliente'),
        last_name: z.string().optional().describe('Apellido'),
        company: z.string().optional().describe('Empresa'),
        email: z.string().optional().describe('Email'),
        phone: z.string().optional().describe('Teléfono'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_client', rawArgs);
        const firstName = args.first_name;
        if (!firstName) return { error: 'Falta el nombre del cliente.' };

        const { data, error } = await supabase
          .from('clients')
          .insert({
            first_name: firstName,
            last_name: args.last_name || '',
            company: args.company || '',
            email: args.email || '',
            phone: args.phone || '',
            status: 'Nuevo',
            owner_id: ctx.crmUserId,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        await logActivity(supabase, ctx, {
          clientId: data.id,
          type: 'Telegram',
          description: `Cliente creado desde Telegram: ${firstName} ${args.last_name || ''} ${args.company ? `(${args.company})` : ''}`.trim(),
        });

        return {
          client: { name: `${data.first_name} ${data.last_name}`.trim(), company: data.company },
          message: 'Cliente creado correctamente',
        };
      },
    },

    create_task: {
      description: 'Crea una tarea. Campos: title (título), description, priority (Alta/Media/Baja), clientId, dueDate (fecha límite YYYY-MM-DD).',
      parameters: z.object({
        title: z.string().optional().describe('Título de la tarea'),
        description: z.string().optional(),
        priority: z.string().optional().default('Media'),
        clientId: z.string().optional().describe('ID del cliente'),
        dueDate: z.string().optional().describe('Fecha límite'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_task', rawArgs);
        if (!args.title) return { error: 'Falta el título de la tarea.' };

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: args.title,
            description: args.description || '',
            priority: args.priority || 'Media',
            status: 'Pendiente',
            client_id: args.clientId || null,
            due_date: args.dueDate || null,
            assigned_to: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        if (args.clientId) {
          await logActivity(supabase, ctx, {
            clientId: args.clientId,
            type: 'Tarea creada',
            description: `Tarea creada desde Telegram: "${args.title}"`,
          });
        }

        return {
          task: { title: data.title, priority: data.priority, due_date: data.due_date },
          message: 'Tarea creada correctamente',
        };
      },
    },

    list_tasks: {
      description: 'Lista tareas pendientes. Filtra por hoy o urgentes.',
      parameters: z.object({
        today: z.boolean().optional().default(false),
        urgent: z.boolean().optional().default(false),
        limit: z.number().optional().default(10),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_tasks', rawArgs);
        let query = supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, clients(first_name, last_name)')
          .eq('assigned_to', ctx.crmUserId)
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(args.limit || 10);

        if (args.today) {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
          query = query.gte('due_date', todayStart.toISOString()).lte('due_date', todayEnd.toISOString());
        }
        if (args.urgent) query = query.eq('priority', 'Alta');

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { tasks: data, count: data?.length || 0 };
      },
    },

    complete_task: {
      description: 'Marca una tarea como completada',
      parameters: z.object({
        taskId: z.string().uuid().describe('ID de la tarea'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('complete_task', rawArgs);
        if (!args.taskId) return { error: 'Falta el ID de la tarea.' };

        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'Completada', completed_at: new Date().toISOString() })
          .eq('id', args.taskId)
          .select('id, title, client_id')
          .single();
        if (error) return { error: error.message };

        if (data.client_id) {
          await logActivity(supabase, ctx, {
            clientId: data.client_id,
            type: 'Tarea completada',
            description: `Tarea completada desde Telegram: "${data.title}"`,
          });
        }
        return { task: { title: data.title }, message: 'Tarea completada' };
      },
    },

    get_agenda: {
      description: 'Eventos del calendario para una fecha (YYYY-MM-DD)',
      parameters: z.object({
        date: z.string().describe('Fecha YYYY-MM-DD'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('get_agenda', rawArgs);
        if (!args.date) return { error: 'Falta la fecha.' };

        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, description, type, start_at, end_at, status, clients(first_name, last_name)')
          .eq('owner_id', ctx.crmUserId)
          .gte('start_at', `${args.date}T00:00:00`)
          .lt('start_at', `${args.date}T23:59:59`)
          .order('start_at');
        if (error) return { error: error.message };
        return { events: data, count: data?.length || 0 };
      },
    },

    create_event: {
      description: 'Crea un evento/reunión. Campos: title (título), description, type (tipo), startAt (inicio ISO 8601), endAt (fin ISO 8601), clientId.',
      parameters: z.object({
        title: z.string().optional().describe('Título del evento'),
        description: z.string().optional(),
        type: z.string().optional().default('Reunión'),
        startAt: z.string().optional().describe('Inicio ISO 8601'),
        endAt: z.string().optional().describe('Fin ISO 8601'),
        clientId: z.string().optional().describe('ID del cliente'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_event', rawArgs);
        if (!args.title) return { error: 'Falta el título del evento.' };
        if (!args.startAt) return { error: 'Falta la fecha/hora de inicio.' };

        const endAt = args.endAt || (() => {
          const start = new Date(args.startAt);
          start.setHours(start.getHours() + 1);
          return start.toISOString();
        })();

        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            title: args.title,
            description: args.description || '',
            type: args.type || 'Reunión',
            start_at: args.startAt,
            end_at: endAt,
            status: 'Programado',
            client_id: args.clientId || null,
            owner_id: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        if (args.clientId) {
          await logActivity(supabase, ctx, {
            clientId: args.clientId,
            type: 'Reunión',
            description: `Reunión agendada desde Telegram: "${args.title}" el ${args.startAt}`,
          });
        }

        try {
          const { syncEventToGoogle } = await import('@/lib/google/calendar');
          const googleSync = await syncEventToGoogle({
            title: args.title, description: args.description, startAt: args.startAt, endAt,
          });
          return {
            event: { title: data.title, start: data.start_at },
            message: 'Evento creado' + (googleSync ? ' y sincronizado con Google Calendar' : ''),
          };
        } catch {
          return { event: { title: data.title, start: data.start_at }, message: 'Evento creado correctamente' };
        }
      },
    },

    list_opportunities: {
      description: 'Lista oportunidades del pipeline. Filtro opcional por etapa.',
      parameters: z.object({
        stage: z.string().optional().describe('Filtrar por etapa'),
        limit: z.number().optional().default(10),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_opportunities', rawArgs);
        let query = supabase
          .from('opportunities')
          .select('id, title, stage, estimated_value, probability, clients(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(args.limit || 10);
        if (args.stage) query = query.eq('stage', args.stage);

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { opportunities: data, count: data?.length || 0 };
      },
    },

    create_opportunity: {
      description: 'Crea una oportunidad comercial. Campos: title (título), stage (etapa), clientId, estimatedValue (valor).',
      parameters: z.object({
        title: z.string().optional().describe('Título'),
        stage: z.string().optional().default('Contacto Inicial'),
        clientId: z.string().optional().describe('ID del cliente'),
        estimatedValue: z.number().optional().describe('Valor estimado'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_opportunity', rawArgs);
        if (!args.title) return { error: 'Falta el título de la oportunidad.' };

        const { data, error } = await supabase
          .from('opportunities')
          .insert({
            title: args.title,
            stage: args.stage || 'Contacto Inicial',
            client_id: args.clientId || null,
            assigned_to: ctx.crmUserId,
            estimated_value: args.estimatedValue || null,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        if (args.clientId) {
          await logActivity(supabase, ctx, {
            clientId: args.clientId, opportunityId: data.id, type: 'Telegram',
            description: `Oportunidad creada desde Telegram: "${args.title}"`,
          });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: 'Oportunidad creada correctamente' };
      },
    },

    update_opportunity_stage: {
      description: 'Cambia la etapa de una oportunidad. Campos: opportunityId, stage (nueva etapa).',
      parameters: z.object({
        opportunityId: z.string().uuid().describe('ID de la oportunidad'),
        stage: z.string().describe('Nueva etapa'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('update_opportunity_stage', rawArgs);
        if (!args.opportunityId) return { error: 'Falta el ID de la oportunidad.' };
        if (!args.stage) return { error: 'Falta la nueva etapa.' };

        const { data: prev } = await supabase
          .from('opportunities').select('title, stage, client_id').eq('id', args.opportunityId).single();

        const { data, error } = await supabase
          .from('opportunities').update({ stage: args.stage }).eq('id', args.opportunityId).select().single();
        if (error) return { error: error.message };

        if (prev?.client_id) {
          await logActivity(supabase, ctx, {
            clientId: prev.client_id, opportunityId: args.opportunityId, type: 'Cambio de estado',
            description: `Oportunidad "${prev.title}" movida de "${prev.stage}" a "${args.stage}" desde Telegram`,
          });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: `Oportunidad movida a: ${args.stage}` };
      },
    },

    get_daily_summary: {
      description: 'Resumen ejecutivo del día: clientes, tareas, reuniones, urgencias',
      parameters: z.object({}).passthrough(),
      execute: async () => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        const [clientsRes, tasksRes, eventsRes, urgentRes, overdueRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('tasks').select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId).gte('due_date', todayStart.toISOString())
            .lte('due_date', todayEnd.toISOString()).neq('status', 'Completada'),
          supabase.from('calendar_events').select('id', { count: 'exact', head: true })
            .eq('owner_id', ctx.crmUserId).gte('start_at', todayStart.toISOString())
            .lte('start_at', todayEnd.toISOString()),
          supabase.from('tasks').select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId).eq('priority', 'Alta').neq('status', 'Completada'),
          supabase.from('tasks').select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId).lt('due_date', todayStart.toISOString()).neq('status', 'Completada'),
        ]);

        return {
          totalClients: clientsRes.count || 0, tasksToday: tasksRes.count || 0,
          eventsToday: eventsRes.count || 0, urgentTasks: urgentRes.count || 0,
          overdueTasks: overdueRes.count || 0,
          date: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        };
      },
    },

    delete_client: {
      description: 'Elimina un cliente. SIEMPRE pide confirmación explícita antes.',
      parameters: z.object({
        clientId: z.string().uuid().describe('ID del cliente'),
        confirmed: z.boolean().describe('true solo si el usuario ha confirmado'),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('delete_client', rawArgs);
        if (!args.confirmed) {
          return { requiresConfirmation: true, message: '⚠️ ¿Seguro? Responde "Sí, elimínalo" para confirmar.' };
        }

        const { data: client } = await supabase
          .from('clients').select('first_name, last_name, company').eq('id', args.clientId).single();

        const { error } = await supabase.from('clients').update({ status: 'Eliminado' }).eq('id', args.clientId);
        if (error) return { error: error.message };

        await logActivity(supabase, ctx, {
          clientId: args.clientId, type: 'Telegram',
          description: `Cliente eliminado: ${client?.first_name} ${client?.last_name} (${client?.company})`,
        });
        return { success: true, message: `Cliente ${client?.first_name} ${client?.last_name} eliminado.` };
      },
    },

    list_notifications: {
      description: 'Lista notificaciones recientes',
      parameters: z.object({
        unreadOnly: z.boolean().optional().default(true),
        limit: z.number().optional().default(5),
      }).passthrough(),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_notifications', rawArgs);
        let query = supabase.from('notifications').select('id, title, message, type, created_at, read')
          .order('created_at', { ascending: false }).limit(args.limit || 5);
        if (args.unreadOnly !== false) query = query.eq('read', false);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { notifications: data, count: data?.length || 0 };
      },
    },

    mark_notifications_as_read: {
      description: 'Marca notificaciones como leídas',
      parameters: z.object({ all: z.boolean().optional().default(true) }).passthrough(),
      execute: async () => {
        const { error } = await supabase.from('notifications').update({ read: true })
          .eq('user_id', ctx.crmUserId).eq('read', false);
        if (error) return { error: error.message };
        return { success: true, message: 'Notificaciones marcadas como leídas' };
      },
    },

  } as const;
}
