import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (first_name, last_name, company),
          opportunities (title)
        `)
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });

      if (sbError) throw sbError;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  return { tasks, loading, error, refresh: fetchTasks };
}

export function useMyTasks(userId: string) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('*, clients(first_name, last_name)')
        .eq('assigned_to', userId)
        .order('due_date', { ascending: true });
      setTasks(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [userId]);

  return { tasks, loading, refresh: fetchMyTasks };
}
