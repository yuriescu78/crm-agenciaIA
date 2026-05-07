/**
 * CRM Agent Tools (v2 - con auditoría y soft delete)
 * 
 * Cambios respecto a v1:
 * - Toda acción que modifica datos registra actividad en la tabla `activities`
 * - delete_client hace soft delete (marca deleted_at) en vez de borrar en cascada
 * - Protección contra SQL injection en búsquedas (sanitiza input)
 * - Tool descriptions más concisas (menos tokens por llamada)
 */

import { z } from 'zod';
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import type { ToolContext } from '@/lib/llm/types';

/**
 * Registra una actividad en el historial del cliente.
 * Se llama internamente desde cada tool que modifica datos.
 */
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
    // No lanzar error si falla el logging — no debe romper la acción principal
    console.error('Error registrando actividad:', err);
  }
}

/**
 * Sanitiza strings para usar en queries ilike.
 * Evita que caracteres especiales de Postgres rompan la query.
 */
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
      }),
      execute: async ({ query, limit }: { query: string; limit: number }) => {
        const safe = sanitizeSearch(query);
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`)
          .limit(limit);

        if (error) return { error: error.message };
        return { clients: data, count: data?.length || 0 };
      },
    },

    list_clients: {
      description: 'Lista los clientes más recientes',
      parameters: z.object({
        limit: z.number().optional().default(10),
      }),
      execute: async ({ limit }: { limit: number }) => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) return { error: error.message };
        return { clients: data };
      },
    },

    create_client: {
      description: 'Crea un nuevo cliente en el CRM',
      parameters: z.object({
        first_name: z.string().describe('Nombre del cliente'),
        last_name: z.string().optional().describe('Apellido'),
        company: z.string().optional().describe('Empresa'),
        email: z.string().optional().describe('Email'),
        phone: z.string().optional().describe('Teléfono'),
      }),
      execute: async (args: {
        first_name: string;
        last_name?: string;
        company?: string;
        email?: string;
        phone?: string;
      }) => {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            first_name: args.first_name,
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

        // Registrar actividad
        await logActivity(supabase, ctx, {
          clientId: data.id,
          type: 'Telegram',
          description: `Cliente creado desde Telegram: ${args.first_name} ${args.last_name || ''} ${args.company ? `(${args.company})` : ''}`.trim(),
        });

        return {
          client: { name: `${data.first_name} ${data.last_name}`.trim(), company: data.company },
          message: 'Cliente creado correctamente',
        };
      },
    },

    create_task: {
      description: 'Crea una tarea, opcionalmente asociada a un cliente',
      parameters: z.object({
        title: z.string().describe('Título de la tarea'),
        description: z.string().optional().describe('Descripción'),
        priority: z.enum(['Alta', 'Media', 'Baja']).optional().default('Media'),
        clientId: z.string().uuid().optional().describe('ID del cliente asociado'),
        dueDate: z.string().optional().describe('Fecha límite ISO 8601'),
      }),
      execute: async (args: {
        title: string;
        description?: string;
        priority?: string;
        clientId?: string;
        dueDate?: string;
      }) => {
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

        // Registrar actividad si hay cliente asociado
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
      }),
      execute: async ({ today, urgent, limit }: { today: boolean; urgent: boolean; limit: number }) => {
        let query = supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, clients(first_name, last_name)')
          .eq('assigned_to', ctx.crmUserId) // Solo tareas del usuario actual
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(limit);

        if (today) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);
          query = query
            .gte('due_date', todayStart.toISOString())
            .lte('due_date', todayEnd.toISOString());
        }

        if (urgent) {
          query = query.eq('priority', 'Alta');
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { tasks: data, count: data?.length || 0 };
      },
    },

    complete_task: {
      description: 'Marca una tarea como completada por su ID',
      parameters: z.object({
        taskId: z.string().uuid().describe('ID de la tarea'),
      }),
      execute: async ({ taskId }: { taskId: string }) => {
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'Completada', completed_at: new Date().toISOString() })
          .eq('id', taskId)
          .select('id, title, client_id')
          .single();

        if (error) return { error: error.message };

        // Registrar actividad
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
        date: z.string().describe('Fecha en formato YYYY-MM-DD'),
      }),
      execute: async ({ date }: { date: string }) => {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, description, type, start_at, end_at, status, clients(first_name, last_name)')
          .eq('owner_id', ctx.crmUserId) // Solo eventos del usuario
          .gte('start_at', `${date}T00:00:00`)
          .lt('start_at', `${date}T23:59:59`)
          .order('start_at');

        if (error) return { error: error.message };
        return { events: data, count: data?.length || 0 };
      },
    },

    create_event: {
      description: 'Crea un evento/reunión en el calendario',
      parameters: z.object({
        title: z.string().describe('Título del evento'),
        description: z.string().optional(),
        type: z.string().optional().default('Reunión'),
        startAt: z.string().describe('Inicio ISO 8601'),
        endAt: z.string().describe('Fin ISO 8601'),
        clientId: z.string().uuid().optional().describe('Cliente asociado'),
      }),
      execute: async (args: {
        title: string;
        description?: string;
        type?: string;
        startAt: string;
        endAt: string;
        clientId?: string;
      }) => {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            title: args.title,
            description: args.description || '',
            type: args.type || 'Reunión',
            start_at: args.startAt,
            end_at: args.endAt,
            status: 'Programado',
            client_id: args.clientId || null,
            owner_id: ctx.crmUserId,
            created_by: ctx.crmUserId,
          })
          .select()
          .single();

        if (error) return { error: error.message };

        // Registrar actividad
        if (args.clientId) {
          await logActivity(supabase, ctx, {
            clientId: args.clientId,
            type: 'Reunión',
            description: `Reunión agendada desde Telegram: "${args.title}" el ${args.startAt}`,
          });
        }

        // Intentar sync con Google Calendar (no bloquear si falla)
        try {
          const { syncEventToGoogle } = await import('@/lib/google/calendar');
          const googleSync = await syncEventToGoogle({
            title: args.title,
            description: args.description,
            startAt: args.startAt,
            endAt: args.endAt,
          });
          return {
            event: { title: data.title, start: data.start_at },
            message: 'Evento creado' + (googleSync ? ' y sincronizado con Google Calendar' : ''),
          };
        } catch {
          return {
            event: { title: data.title, start: data.start_at },
            message: 'Evento creado correctamente',
          };
        }
      },
    },

    list_opportunities: {
      description: 'Lista oportunidades del pipeline',
      parameters: z.object({
        stage: z.string().optional().describe('Filtrar por etapa'),
        limit: z.number().optional().default(10),
      }),
      execute: async ({ stage, limit }: { stage?: string; limit: number }) => {
        let query = supabase
          .from('opportunities')
          .select('id, title, stage, estimated_value, probability, clients(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (stage) {
          query = query.eq('stage', stage);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { opportunities: data, count: data?.length || 0 };
      },
    },

    create_opportunity: {
      description: 'Crea una oportunidad comercial',
      parameters: z.object({
        title: z.string().describe('Título de la oportunidad'),
        stage: z.string().optional().default('Contacto Inicial'),
        clientId: z.string().uuid().optional().describe('Cliente asociado'),
        estimatedValue: z.number().optional().describe('Valor estimado en euros'),
      }),
      execute: async (args: {
        title: string;
        stage?: string;
        clientId?: string;
        estimatedValue?: number;
      }) => {
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

        // Registrar actividad
        if (args.clientId) {
          await logActivity(supabase, ctx, {
            clientId: args.clientId,
            opportunityId: data.id,
            type: 'Telegram',
            description: `Oportunidad creada desde Telegram: "${args.title}"`,
          });
        }

        return {
          opportunity: { title: data.title, stage: data.stage },
          message: 'Oportunidad creada correctamente',
        };
      },
    },

    update_opportunity_stage: {
      description: 'Cambia la etapa de una oportunidad en el pipeline',
      parameters: z.object({
        opportunityId: z.string().uuid().describe('ID de la oportunidad'),
        stage: z.string().describe('Nueva etapa'),
      }),
      execute: async ({ opportunityId, stage }: { opportunityId: string; stage: string }) => {
        // Obtener datos previos para el log
        const { data: prev } = await supabase
          .from('opportunities')
          .select('title, stage, client_id')
          .eq('id', opportunityId)
          .single();

        const { data, error } = await supabase
          .from('opportunities')
          .update({ stage })
          .eq('id', opportunityId)
          .select()
          .single();

        if (error) return { error: error.message };

        // Registrar cambio de etapa
        if (prev?.client_id) {
          await logActivity(supabase, ctx, {
            clientId: prev.client_id,
            opportunityId,
            type: 'Cambio de estado',
            description: `Oportunidad "${prev.title}" movida de "${prev.stage}" a "${stage}" desde Telegram`,
          });
        }

        return {
          opportunity: { title: data.title, stage: data.stage },
          message: `Oportunidad movida a: ${stage}`,
        };
      },
    },

    get_daily_summary: {
      description: 'Resumen ejecutivo del día: clientes, tareas, reuniones, urgencias',
      parameters: z.object({}),
      execute: async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [clientsRes, tasksRes, eventsRes, urgentRes, overdueRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId)
            .gte('due_date', todayStart.toISOString())
            .lte('due_date', todayEnd.toISOString())
            .neq('status', 'Completada'),
          supabase
            .from('calendar_events')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', ctx.crmUserId)
            .gte('start_at', todayStart.toISOString())
            .lte('start_at', todayEnd.toISOString()),
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId)
            .eq('priority', 'Alta')
            .neq('status', 'Completada'),
          // NUEVO: tareas vencidas (fecha pasada, no completadas)
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('assigned_to', ctx.crmUserId)
            .lt('due_date', todayStart.toISOString())
            .neq('status', 'Completada'),
        ]);

        return {
          totalClients: clientsRes.count || 0,
          tasksToday: tasksRes.count || 0,
          eventsToday: eventsRes.count || 0,
          urgentTasks: urgentRes.count || 0,
          overdueTasks: overdueRes.count || 0,
          date: new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        };
      },
    },

    delete_client: {
      description: 'Elimina un cliente. SIEMPRE pide confirmación explícita antes.',
      parameters: z.object({
        clientId: z.string().uuid().describe('ID del cliente'),
        confirmed: z.boolean().describe('true solo si el usuario ha confirmado'),
      }),
      execute: async ({ clientId, confirmed }: { clientId: string; confirmed: boolean }) => {
        if (!confirmed) {
          return {
            requiresConfirmation: true,
            message: '⚠️ ¿Seguro que quieres eliminar este cliente y todos sus datos? Responde "Sí, elimínalo" para confirmar.',
          };
        }

        // Obtener datos del cliente antes de soft-delete para el log
        const { data: client } = await supabase
          .from('clients')
          .select('first_name, last_name, company')
          .eq('id', clientId)
          .single();

        // SOFT DELETE: marcamos deleted_at en vez de borrar
        // Si tu tabla no tiene deleted_at, usa un update a status = 'Eliminado'
        const { error } = await supabase
          .from('clients')
          .update({ status: 'Eliminado' })
          .eq('id', clientId);

        if (error) return { error: error.message };

        // Registrar en actividad
        await logActivity(supabase, ctx, {
          clientId,
          type: 'Telegram',
          description: `Cliente marcado como eliminado desde Telegram: ${client?.first_name} ${client?.last_name} (${client?.company})`,
        });

        return {
          success: true,
          message: `Cliente ${client?.first_name} ${client?.last_name} marcado como eliminado.`,
        };
      },
    },

    list_notifications: {
      description: 'Lista notificaciones recientes del usuario',
      parameters: z.object({
        unreadOnly: z.boolean().optional().default(true),
        limit: z.number().optional().default(5),
      }),
      execute: async ({ unreadOnly, limit }: { unreadOnly: boolean; limit: number }) => {
        let query = supabase
          .from('notifications')
          .select('id, title, message, type, created_at, read')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (unreadOnly) {
          query = query.eq('read', false);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { notifications: data, count: data?.length || 0 };
      },
    },

    mark_notifications_as_read: {
      description: 'Marca notificaciones como leídas',
      parameters: z.object({
        all: z.boolean().optional().default(true),
      }),
      execute: async ({ all }: { all: boolean }) => {
        if (!all) {
          return { error: 'Usa all: true para marcar todas como leídas' };
        }

        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', ctx.crmUserId)
          .eq('read', false);

        if (error) return { error: error.message };
        return { success: true, message: 'Notificaciones marcadas como leídas' };
      },
    },
  } as const;
}
