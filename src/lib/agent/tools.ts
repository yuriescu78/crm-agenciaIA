/**
 * CRM Agent Tools (v4 - FINAL)
 * 
 * Enfoque: schemas MUY permisivos (todo string, todo optional) para que
 * el modelo 8B nunca falle la validación. La normalización y validación
 * real ocurren DENTRO del execute, donde tenemos control total.
 * 
 * Esto funciona con Groq porque:
 * - Todos los campos están en el JSON Schema → no hay additionalProperties
 * - Todo es optional → el modelo no falla si omite un campo
 * - Todo es string → el modelo no falla si envía "5" en vez de 5
 * - La validación de negocio está en el execute
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
      description: 'Busca clientes por nombre, email o empresa. Param: query (texto a buscar).',
      inputSchema: z.object({
        query: z.string().describe('Texto a buscar'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('search_clients', rawArgs);
        const safe = sanitizeSearch(args.query || '');
        if (!safe) return { error: 'Indica qué cliente buscar.' };

        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(5);
        if (error) return { error: error.message };
        return { clients: data, count: data?.length || 0 };
      },
    },

    list_clients: {
      description: 'Lista los clientes más recientes del CRM.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) return { error: error.message };
        return { clients: data };
      },
    },

    create_client: {
      description: 'Crea un nuevo cliente. Params: first_name (nombre), last_name (apellido), company (empresa), email, phone (teléfono). Solo first_name es obligatorio.',
      inputSchema: z.object({
        first_name: z.string().describe('Nombre del cliente'),
        last_name: z.string().optional().describe('Apellido del cliente'),
        company: z.string().optional().describe('Empresa del cliente'),
        email: z.string().optional().describe('Email del cliente'),
        phone: z.string().optional().describe('Teléfono del cliente'),
      }),
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
      description: 'Crea una tarea. Params: title (título, obligatorio), description, priority (Alta/Media/Baja), client_id (UUID del cliente), due_date (fecha YYYY-MM-DD).',
      inputSchema: z.object({
        title: z.string().describe('Título de la tarea'),
        description: z.string().optional().describe('Descripción de la tarea'),
        priority: z.string().optional().describe('Alta, Media o Baja'),
        client_id: z.string().optional().describe('UUID del cliente asociado'),
        due_date: z.string().optional().describe('Fecha límite YYYY-MM-DD'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_task', rawArgs);
        const title = args.title;
        if (!title) return { error: 'Falta el título de la tarea.' };

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title,
            description: args.description || '',
            priority: args.priority || 'Media',
            status: 'Pendiente',
            client_id: args.client_id || args.clientId || null,
            due_date: args.due_date || args.dueDate || null,
            assigned_to: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        const clientId = args.client_id || args.clientId;
        if (clientId) {
          await logActivity(supabase, ctx, {
            clientId,
            type: 'Tarea creada',
            description: `Tarea creada desde Telegram: "${title}"`,
          });
        }
        return {
          task: { title: data.title, priority: data.priority, due_date: data.due_date },
          message: 'Tarea creada correctamente',
        };
      },
    },

    list_tasks: {
      description: 'Lista tareas pendientes del usuario. Params: today (true para solo hoy), urgent (true para solo urgentes).',
      inputSchema: z.object({
        today: z.string().optional().describe('true para filtrar tareas de hoy'),
        urgent: z.string().optional().describe('true para filtrar urgentes'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('list_tasks', rawArgs);
        const isToday = args.today === true || args.today === 'true';
        const isUrgent = args.urgent === true || args.urgent === 'true';

        let query = supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, clients(first_name, last_name)')
          .eq('assigned_to', ctx.crmUserId)
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(10);

        if (isToday) {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
          query = query.gte('due_date', todayStart.toISOString()).lte('due_date', todayEnd.toISOString());
        }
        if (isUrgent) query = query.eq('priority', 'Alta');

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { tasks: data, count: data?.length || 0 };
      },
    },

    complete_task: {
      description: 'Marca una tarea como completada. Param: task_id (UUID de la tarea).',
      inputSchema: z.object({
        task_id: z.string().describe('UUID de la tarea a completar'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('complete_task', rawArgs);
        const taskId = args.task_id || args.taskId;
        if (!taskId) return { error: 'Falta el ID de la tarea.' };

        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'Completada', completed_at: new Date().toISOString() })
          .eq('id', taskId)
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
      description: 'Eventos del calendario para una fecha. Param: date (YYYY-MM-DD).',
      inputSchema: z.object({
        date: z.string().describe('Fecha en formato YYYY-MM-DD'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('get_agenda', rawArgs);
        const date = args.date;
        if (!date) return { error: 'Falta la fecha.' };

        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, description, type, start_at, end_at, status, clients(first_name, last_name)')
          .eq('owner_id', ctx.crmUserId)
          .gte('start_at', `${date}T00:00:00`)
          .lt('start_at', `${date}T23:59:59`)
          .order('start_at');
        if (error) return { error: error.message };
        return { events: data, count: data?.length || 0 };
      },
    },

    create_event: {
      description: 'Crea un evento/reunión. Params: title (título, obligatorio), description, type (tipo), start_at (inicio ISO 8601, obligatorio), end_at (fin ISO 8601), client_id (UUID cliente).',
      inputSchema: z.object({
        title: z.string().describe('Título del evento'),
        description: z.string().optional().describe('Descripción'),
        type: z.string().optional().describe('Tipo: Reunión, Llamada, etc.'),
        start_at: z.string().describe('Fecha y hora de inicio ISO 8601'),
        end_at: z.string().optional().describe('Fecha y hora de fin ISO 8601'),
        client_id: z.string().optional().describe('UUID del cliente asociado'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_event', rawArgs);
        const title = args.title;
        const startAt = args.start_at || args.startAt;
        if (!title) return { error: 'Falta el título del evento.' };
        if (!startAt) return { error: 'Falta la fecha/hora de inicio.' };

        const endAt = args.end_at || args.endAt || (() => {
          const start = new Date(startAt);
          start.setHours(start.getHours() + 1);
          return start.toISOString();
        })();

        const clientId = args.client_id || args.clientId || null;

        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            title,
            description: args.description || '',
            type: args.type || 'Reunión',
            start_at: startAt,
            end_at: endAt,
            status: 'Programado',
            client_id: clientId,
            owner_id: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select()
          .single();
        if (error) return { error: error.message };

        if (clientId) {
          await logActivity(supabase, ctx, {
            clientId,
            type: 'Reunión',
            description: `Reunión agendada desde Telegram: "${title}" el ${startAt}`,
          });
        }

        try {
          const { syncEventToGoogle } = await import('@/lib/google/calendar');
          const googleSync = await syncEventToGoogle({ title, description: args.description, startAt, endAt });
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
      description: 'Lista oportunidades del pipeline comercial. Param opcional: stage (etapa para filtrar).',
      inputSchema: z.object({
        stage: z.string().optional().describe('Etapa para filtrar'),
      }),
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
    },

    create_opportunity: {
      description: 'Crea una oportunidad comercial. Params: title (título, obligatorio), stage (etapa), client_id (UUID cliente), estimated_value (valor en euros).',
      inputSchema: z.object({
        title: z.string().describe('Título de la oportunidad'),
        stage: z.string().optional().describe('Etapa del pipeline'),
        client_id: z.string().optional().describe('UUID del cliente'),
        estimated_value: z.string().optional().describe('Valor estimado en euros'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('create_opportunity', rawArgs);
        if (!args.title) return { error: 'Falta el título de la oportunidad.' };

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
          .select()
          .single();
        if (error) return { error: error.message };

        if (clientId) {
          await logActivity(supabase, ctx, {
            clientId, opportunityId: data.id, type: 'Telegram',
            description: `Oportunidad creada desde Telegram: "${args.title}"`,
          });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: 'Oportunidad creada correctamente' };
      },
    },

    update_opportunity_stage: {
      description: 'Cambia la etapa de una oportunidad. Params: opportunity_id (UUID), stage (nueva etapa).',
      inputSchema: z.object({
        opportunity_id: z.string().describe('UUID de la oportunidad'),
        stage: z.string().describe('Nueva etapa del pipeline'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('update_opportunity_stage', rawArgs);
        const oppId = args.opportunity_id || args.opportunityId;
        if (!oppId) return { error: 'Falta el ID de la oportunidad.' };
        if (!args.stage) return { error: 'Falta la nueva etapa.' };

        const { data: prev } = await supabase
          .from('opportunities').select('title, stage, client_id').eq('id', oppId).single();

        const { data, error } = await supabase
          .from('opportunities').update({ stage: args.stage }).eq('id', oppId).select().single();
        if (error) return { error: error.message };

        if (prev?.client_id) {
          await logActivity(supabase, ctx, {
            clientId: prev.client_id, opportunityId: oppId, type: 'Cambio de estado',
            description: `Oportunidad "${prev.title}" movida de "${prev.stage}" a "${args.stage}" desde Telegram`,
          });
        }
        return { opportunity: { title: data.title, stage: data.stage }, message: `Oportunidad movida a: ${args.stage}` };
      },
    },

    get_daily_summary: {
      description: 'Resumen ejecutivo del día: clientes totales, tareas de hoy, reuniones, urgencias y tareas vencidas.',
      inputSchema: z.object({}),
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
      description: 'Elimina (soft delete) un cliente. SIEMPRE pide confirmación antes. Params: client_id (UUID), confirmed (true/false).',
      inputSchema: z.object({
        client_id: z.string().describe('UUID del cliente'),
        confirmed: z.string().optional().describe('true si el usuario confirmó'),
      }),
      execute: async (rawArgs: any) => {
        const args = normalizeToolParams('delete_client', rawArgs);
        const clientId = args.client_id || args.clientId;
        const confirmed = args.confirmed === true || args.confirmed === 'true';

        if (!confirmed) {
          return { requiresConfirmation: true, message: '⚠️ ¿Seguro? Responde "Sí, elimínalo" para confirmar.' };
        }

        const { data: client } = await supabase
          .from('clients').select('first_name, last_name, company').eq('id', clientId).single();

        const { error } = await supabase.from('clients').update({ status: 'Eliminado' }).eq('id', clientId);
        if (error) return { error: error.message };

        await logActivity(supabase, ctx, {
          clientId, type: 'Telegram',
          description: `Cliente eliminado: ${client?.first_name} ${client?.last_name} (${client?.company})`,
        });
        return { success: true, message: `Cliente ${client?.first_name} ${client?.last_name} eliminado.` };
      },
    },

    list_notifications: {
      description: 'Lista notificaciones recientes no leídas del usuario.',
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, title, message, type, created_at, read')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) return { error: error.message };
        return { notifications: data, count: data?.length || 0 };
      },
    },

    mark_notifications_as_read: {
      description: 'Marca todas las notificaciones como leídas.',
      inputSchema: z.object({}),
      execute: async () => {
        const { error } = await supabase.from('notifications').update({ read: true })
          .eq('user_id', ctx.crmUserId).eq('read', false);
        if (error) return { error: error.message };
        return { success: true, message: 'Notificaciones marcadas como leídas' };
      },
    },

  } as const;
}
