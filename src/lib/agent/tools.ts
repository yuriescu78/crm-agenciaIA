/**
 * CRM Agent Tools
 * Defines the AI SDK tool definitions for the Telegram bot to interact with the CRM.
 * Each tool maps to a Supabase query and is automatically called by the LLM.
 */

import { z } from 'zod';
import { tool, zodSchema } from 'ai';
import { createSupabaseClientForUser } from '@/lib/supabase/client';
import type { ToolContext } from '@/lib/llm/types';

export function buildCrmTools(ctx: ToolContext) {
  const supabase = createSupabaseClientForUser(ctx.crmUserId);

  return {
    searchClients: tool({
      description: 'Busca clientes por nombre, email o empresa',
      inputSchema: z.object({
        query: z.string().describe('Texto a buscar'),
        limit: z.number().optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(limit);

        if (error) return { error: error.message };
        return { clients: data };
      },
    }),

    listClients: tool({
      description: 'Lista los clientes más recientes del CRM',
      inputSchema: z.object({
        limit: z.number().optional().default(10),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, company, phone, status')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) return { error: error.message };
        return { clients: data };
      },
    }),

    createClient: tool({
      description: 'Crea un nuevo cliente en el CRM',
      inputSchema: z.object({
        first_name: z.string().describe('Nombre del cliente'),
        last_name: z.string().optional().describe('Apellido del cliente'),
        company: z.string().optional().describe('Empresa del cliente'),
        email: z.string().optional().describe('Email del cliente'),
        phone: z.string().optional().describe('Teléfono del cliente'),
      }),
      execute: async (args) => {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            first_name: args.first_name,
            last_name: args.last_name || '',
            company: args.company || '',
            email: args.email || '',
            phone: args.phone || '',
            status: 'Nuevo',
          })
          .select()
          .single();

        if (error) return { error: error.message };
        return { client: data, message: 'Cliente creado correctamente' };
      },
    }),

    createTask: tool({
      description: 'Crea una tarea asociada a un cliente o standalone',
      inputSchema: z.object({
        title: z.string().describe('Título de la tarea'),
        description: z.string().optional().describe('Descripción de la tarea'),
        priority: z.enum(['Alta', 'Media', 'Baja']).optional().default('Media').describe('Prioridad de la tarea'),
        clientId: z.string().uuid().optional().describe('ID del cliente asociado'),
        dueDate: z.string().optional().describe('Fecha de vencimiento en formato ISO 8601'),
      }),
      execute: async (args) => {
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
          })
          .select()
          .single();

        if (error) return { error: error.message };
        return { task: data, message: 'Tarea creada correctamente' };
      },
    }),

    listTasks: tool({
      description: 'Lista las tareas pendientes, opcionalmente filtradas por hoy o urgentes',
      inputSchema: z.object({
        today: z.boolean().optional().default(false).describe('Solo tareas de hoy'),
        urgent: z.boolean().optional().default(false).describe('Solo tareas urgentes (prioridad Alta)'),
        limit: z.number().optional().default(10),
      }),
      execute: async ({ today, urgent, limit }) => {
        let query = supabase
          .from('tasks')
          .select('id, title, description, status, priority, due_date, clients(first_name, last_name)')
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
        return { tasks: data };
      },
    }),

    completeTask: tool({
      description: 'Marca una tarea como completada',
      inputSchema: z.object({
        taskId: z.string().uuid().describe('ID de la tarea a completar'),
      }),
      execute: async ({ taskId }) => {
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'Completada' })
          .eq('id', taskId)
          .select()
          .single();

        if (error) return { error: error.message };
        return { task: data, message: 'Tarea completada' };
      },
    }),

    getAgenda: tool({
      description: 'Devuelve los eventos del calendario para una fecha',
      inputSchema: z.object({
        date: z.string().describe('Fecha en formato YYYY-MM-DD'),
      }),
      execute: async ({ date }) => {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('id, title, description, type, start_at, end_at, status, client_id')
          .gte('start_at', `${date}T00:00:00`)
          .lt('start_at', `${date}T23:59:59`)
          .order('start_at');

        if (error) return { error: error.message };
        return { events: data };
      },
    }),

    createEvent: tool({
      description: 'Crea un evento en el calendario',
      inputSchema: z.object({
        title: z.string().describe('Título del evento'),
        description: z.string().optional().describe('Descripción del evento'),
        type: z.string().optional().default('Reunión').describe('Tipo de evento'),
        startAt: z.string().describe('Fecha y hora de inicio en ISO 8601'),
        endAt: z.string().describe('Fecha y hora de fin en ISO 8601'),
        clientId: z.string().uuid().optional().describe('ID del cliente asociado'),
      }),
      execute: async (args) => {
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
          })
          .select()
          .single();

        if (error) return { error: error.message };
        return { event: data, message: 'Evento creado correctamente' };
      },
    }),

    listOpportunities: tool({
      description: 'Lista las oportunidades del pipeline comercial',
      inputSchema: z.object({
        limit: z.number().optional().default(10),
      }),
      execute: async ({ limit }) => {
        const { data, error } = await supabase
          .from('opportunities')
          .select('id, title, stage, clients(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) return { error: error.message };
        return { opportunities: data };
      },
    }),

    createOpportunity: tool({
      description: 'Crea una nueva oportunidad comercial en el pipeline',
      inputSchema: z.object({
        title: z.string().describe('Título de la oportunidad'),
        stage: z.string().optional().default('Contacto Inicial').describe('Etapa del pipeline'),
        clientId: z.string().uuid().optional().describe('ID del cliente asociado'),
      }),
      execute: async (args) => {
        const { data, error } = await supabase
          .from('opportunities')
          .insert({
            title: args.title,
            stage: args.stage || 'Contacto Inicial',
            client_id: args.clientId || null,
            assigned_to: ctx.crmUserId,
          })
          .select()
          .single();

        if (error) return { error: error.message };
        return { opportunity: data, message: 'Oportunidad creada correctamente' };
      },
    }),

    updateOpportunityStage: tool({
      description: 'Actualiza la etapa de una oportunidad en el pipeline',
      inputSchema: z.object({
        opportunityId: z.string().uuid().describe('ID de la oportunidad'),
        stage: z.string().describe('Nueva etapa del pipeline'),
      }),
      execute: async ({ opportunityId, stage }) => {
        const { data, error } = await supabase
          .from('opportunities')
          .update({ stage })
          .eq('id', opportunityId)
          .select()
          .single();

        if (error) return { error: error.message };
        return { opportunity: data, message: `Oportunidad movida a: ${stage}` };
      },
    }),

    getDailySummary: tool({
      description: 'Obtiene un resumen general del día: clientes totales, tareas pendientes, eventos de hoy y tareas urgentes',
      inputSchema: z.object({}),
      execute: async () => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [clientsRes, tasksRes, eventsRes, urgentRes] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('tasks').select('id', { count: 'exact', head: true })
            .gte('due_date', todayStart.toISOString())
            .lte('due_date', todayEnd.toISOString())
            .neq('status', 'Completada'),
          supabase.from('calendar_events').select('id', { count: 'exact', head: true })
            .gte('start_at', todayStart.toISOString())
            .lte('start_at', todayEnd.toISOString()),
          supabase.from('tasks').select('id', { count: 'exact', head: true })
            .eq('priority', 'Alta')
            .neq('status', 'Completada'),
        ]);

        return {
          totalClients: clientsRes.count || 0,
          tasksToday: tasksRes.count || 0,
          eventsToday: eventsRes.count || 0,
          urgentTasks: urgentRes.count || 0,
          date: new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        };
      },
    }),

    // Tool destructiva: pide confirmación
    deleteClient: tool({
      description: 'Elimina un cliente. SIEMPRE pide confirmación al usuario antes de ejecutar.',
      inputSchema: z.object({
        clientId: z.string().uuid().describe('ID del cliente a eliminar'),
        confirmed: z.boolean().describe('Solo true si el usuario ha confirmado explícitamente'),
      }),
      execute: async ({ clientId, confirmed }) => {
        if (!confirmed) {
          return {
            requiresConfirmation: true,
            message: 'Esta acción no se ejecutará sin confirmación explícita del usuario.',
          };
        }
        
        // Manual cascade delete to avoid constraint errors
        await supabase.from('activities').delete().eq('client_id', clientId);
        await supabase.from('calendar_events').delete().eq('client_id', clientId);
        await supabase.from('documents').delete().eq('client_id', clientId);
        await supabase.from('tasks').delete().eq('client_id', clientId);
        await supabase.from('opportunities').delete().eq('client_id', clientId);

        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);

        if (error) return { error: error.message };
        return { success: true, message: 'Cliente y todas sus dependencias (tareas, eventos, oportunidades, etc.) eliminados correctamente' };
      },
    }),
  };
}
