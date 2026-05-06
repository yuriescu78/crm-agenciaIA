import { supabase } from '@/lib/supabase';

export interface TelegramNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

/**
 * Fetches unread notifications for a user and formats them for Telegram.
 */
export async function getUnreadNotificationsForTelegram(crmUserId: string): Promise<string> {
  try {
    // 1. Fetch unread notifications
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', crmUserId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      return "📭 No tienes notificaciones nuevas por ahora.";
    }

    // 2. Format message
    let response = `🔔 *Tienes ${data.length} notificaciones nuevas:*\n\n`;

    for (const notif of data) {
      const date = new Date(notif.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      let icon = '📢';
      
      if (notif.type === 'new_client') icon = '👤';
      if (notif.type === 'task_assigned') icon = '✅';
      if (notif.type === 'opportunity_change') icon = '📈';
      if (notif.type === 'opportunity_comment') icon = '💬';

      response += `${icon} *${notif.title}*\n${notif.message}\n_🕒 ${date}_\n\n`;
    }

    response += "--- \n_Usa /leidas para marcar todas como leídas._";

    // 3. Mark these as read automatically? 
    // The user said: "si se consultan por el usuario en telegram que se den por leidas"
    const ids = data.map(n => n.id);
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', ids);

    return response;
  } catch (error) {
    console.error('Error fetching telegram notifications:', error);
    return "❌ Error al consultar las notificaciones.";
  }
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(crmUserId: string): Promise<string> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', crmUserId)
      .eq('read', false);

    if (error) throw error;
    return "✅ Todas tus notificaciones han sido marcadas como leídas.";
  } catch (error) {
    console.error('Error marking all as read:', error);
    return "❌ Error al actualizar las notificaciones.";
  }
}
