"use server";

/**
 * CRM Actions Module
 * Executes real CRUD operations against Supabase for the Telegram agent.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// ============================================================
// CLIENTS
// ============================================================

export async function listClients(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clients')
    .select('id, first_name, last_name, company, email, phone, status')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error: error?.message || null };
}

export async function searchClients(query: string): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clients')
    .select('id, first_name, last_name, company, email, phone, status')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(10);
  return { data, error: error?.message || null };
}

export async function getClient(id: string): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error: error?.message || null };
}

export async function createClient(clientData: {
  first_name: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  status?: string;
}): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clients')
    .insert({
      first_name: clientData.first_name,
      last_name: clientData.last_name || '',
      company: clientData.company || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      status: clientData.status || 'Nuevo',
    })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateClient(id: string, updates: Record<string, any>): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteClient(id: string): Promise<{ error: string | null }> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('clients').delete().eq('id', id);
  return { error: error?.message || null };
}

// ============================================================
// TASKS
// ============================================================

export async function listTasks(filters?: { today?: boolean; urgent?: boolean; status?: string }, limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  let query = db
    .from('tasks')
    .select('id, title, description, status, priority, due_date, clients(first_name, last_name)')
    .neq('status', 'Completada')
    .order('due_date', { ascending: true })
    .limit(limit);

  if (filters?.today) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    query = query.gte('due_date', todayStart.toISOString()).lte('due_date', todayEnd.toISOString());
  }

  if (filters?.urgent) {
    query = query.eq('priority', 'Alta');
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  client_id?: string;
  assigned_to?: string;
}): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'Media',
      status: 'Pendiente',
      due_date: taskData.due_date || null,
      client_id: taskData.client_id || null,
      assigned_to: taskData.assigned_to || null,
    })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateTask(id: string, updates: Record<string, any>): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function completeTask(id: string): Promise<{ data: any | null; error: string | null }> {
  return updateTask(id, { status: 'Completada' });
}

export async function deleteTask(id: string): Promise<{ error: string | null }> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('tasks').delete().eq('id', id);
  return { error: error?.message || null };
}

// ============================================================
// CALENDAR EVENTS
// ============================================================

export async function listEvents(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('calendar_events')
    .select('id, title, description, type, start_at, end_at, status')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(limit);
  return { data, error: error?.message || null };
}

export async function createEvent(eventData: {
  title: string;
  description?: string;
  type?: string;
  start_at: string;
  end_at: string;
  client_id?: string;
  owner_id?: string;
}): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('calendar_events')
    .insert({
      title: eventData.title,
      description: eventData.description || '',
      type: eventData.type || 'Reunión',
      start_at: eventData.start_at,
      end_at: eventData.end_at,
      status: 'Programado',
      client_id: eventData.client_id || null,
      owner_id: eventData.owner_id || null,
    })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteEvent(id: string): Promise<{ error: string | null }> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('calendar_events').delete().eq('id', id);
  return { error: error?.message || null };
}

// ============================================================
// PIPELINE / OPPORTUNITIES
// ============================================================

export async function listOpportunities(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('opportunities')
    .select('id, title, stage, clients(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error: error?.message || null };
}

export async function createOpportunity(oppData: {
  title: string;
  stage?: string;
  client_id?: string;
  assigned_to?: string;
}): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('opportunities')
    .insert({
      title: oppData.title,
      stage: oppData.stage || 'Contacto Inicial',
      client_id: oppData.client_id || null,
      assigned_to: oppData.assigned_to || null,
    })
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function updateOpportunity(id: string, updates: Record<string, any>): Promise<{ data: any | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: error?.message || null };
}

export async function deleteOpportunity(id: string): Promise<{ error: string | null }> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('opportunities').delete().eq('id', id);
  return { error: error?.message || null };
}

// ============================================================
// DAILY SUMMARY
// ============================================================

export async function getDailySummary(): Promise<string> {
  const db = getSupabaseAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [clientsRes, tasksRes, eventsRes, urgentRes] = await Promise.all([
    db.from('clients').select('id', { count: 'exact', head: true }),
    db.from('tasks').select('id', { count: 'exact', head: true })
      .gte('due_date', todayStart.toISOString())
      .lte('due_date', todayEnd.toISOString())
      .neq('status', 'Completada'),
    db.from('calendar_events').select('id', { count: 'exact', head: true })
      .gte('start_at', todayStart.toISOString())
      .lte('start_at', todayEnd.toISOString()),
    db.from('tasks').select('id', { count: 'exact', head: true })
      .eq('priority', 'Alta')
      .neq('status', 'Completada'),
  ]);

  return [
    `📈 *Resumen del Día — ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}*`,
    '',
    `👥 *Clientes Totales:* ${clientsRes.count || 0}`,
    `📋 *Tareas para Hoy:* ${tasksRes.count || 0}`,
    `📅 *Eventos de Hoy:* ${eventsRes.count || 0}`,
    `🔴 *Tareas Urgentes:* ${urgentRes.count || 0}`,
  ].join('\n');
}

// ============================================================
// TELEGRAM MANAGEMENT
// ============================================================

export async function generateLinkCode(userId: string): Promise<{ code: string | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { error } = await db
    .from('telegram_link_codes')
    .insert({
      code,
      user_id: userId,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

  if (error) return { code: null, error: error.message };
  return { code, error: null };
}

export async function listTelegramUsers(): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('telegram_users')
    .select(`
      id,
      telegram_user_id,
      created_at,
      user_id,
      users:user_id (id, email)
    `)
    .eq('active', true);
    
  return { data, error: error?.message || null };
}

export async function listTelegramLogs(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('telegram_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return { data, error: error?.message || null };
}

// ============================================================
// AGENT CONFIGURATION
// ============================================================

export async function getAgentConfig(userId: string): Promise<any | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('users')
    .select('agent_config')
    .eq('id', userId)
    .single();
    
  if (error || !data) return null;
  return data.agent_config;
}

export async function syncGoogleDrive(clientId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { syncFolderFiles } = await import('@/lib/google/drive');
    const result = await syncFolderFiles(clientId);
    
    if ('error' in result) {
      return { success: false, error: result.error };
    }
    
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error('Error in syncGoogleDrive action:', error);
    return { success: false, error: error.message };
  }
}

export async function listDocuments(clientId: string): Promise<{ data: any[] | null; error: string | null }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
    
  return { data, error: error?.message || null };
}

export async function deleteDocument(documentId: string): Promise<{ success: boolean; error: string | null }> {
  const db = getSupabaseAdmin();

  const { data: doc } = await db
    .from('documents')
    .select('google_drive_id')
    .eq('id', documentId)
    .single();

  if (doc?.google_drive_id) {
    try {
      const { deleteFileFromDrive } = await import('@/lib/google/drive');
      await deleteFileFromDrive(doc.google_drive_id);
    } catch (driveErr: any) {
      console.error('Error deleting from Drive:', driveErr?.message);
      // Continúa con el borrado en DB aunque falle Drive
    }
  }

  const { error } = await db
    .from('documents')
    .delete()
    .eq('id', documentId);

  return { success: !error, error: error?.message || null };
}

export async function checkGoogleConnection(): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('google_tokens')
    .select('refresh_token')
    .eq('account_email', 'elitoragenciaia@gmail.com')
    .single();

  if (error || !data || !data.refresh_token) {
    return false;
  }

  // Verify the token actually works — not just that it exists in the DB
  try {
    const { google } = await import('googleapis');
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2.setCredentials({ refresh_token: data.refresh_token });
    await oauth2.getAccessToken();
    return true;
  } catch {
    return false;
  }
}

export async function uploadDocument(clientId: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No se encontró el archivo' };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { uploadFileToDrive, syncFolderFiles } = await import('@/lib/google/drive');
    const result = await uploadFileToDrive(clientId, {
      name: file.name,
      mimeType: file.type,
      body: buffer
    });

    // Automatically sync after upload to update the database
    await syncFolderFiles(clientId);

    return { success: true, data: result };
  } catch (error: any) {
    const data = error?.response?.data;
    const detail = data?.error?.message
      || (data?.error && typeof data.error === 'string' ? `${data.error}${data.error_description ? ': ' + data.error_description : ''}` : null)
      || error.message;
    console.error('Error in uploadDocument action:', detail, data);
    return { success: false, error: detail };
  }
}

