import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { userProfile, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Usamos el ID del usuario de la sesión de Supabase
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    };

    fetchNotifications();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            if (!newNotif.read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as Notification;
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotif.id ? updatedNotif : n))
            );
            
            // Recalcular no leídas (una forma simple es revisar el estado local)
            setNotifications(prev => {
              setUnreadCount(prev.filter(n => !n.read).length);
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
