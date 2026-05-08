import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user?.id) {
      setClients([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setClients(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.id]);

  return { clients, loading, error, refresh: fetchClients };
}

export function useClient(id: string) {
  const { user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = async () => {
    if (!id || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (sbError) throw sbError;
      setClient(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user?.id) fetchClient();
  }, [id, user?.id]);

  return { client, loading, error, refresh: fetchClient };
}
