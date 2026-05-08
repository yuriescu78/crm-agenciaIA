import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useTasks() {
  const { loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (first_name, last_name, company),
          opportunities (title)
        `)
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
    if (!authLoading) fetchTasks();
  }, [authLoading]);

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
