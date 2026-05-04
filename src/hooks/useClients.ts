import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('clients')
        .select('*')
        .order('last_activity_at', { ascending: false });

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
  }, []);

  return { clients, loading, error, refresh: fetchClients };
}

export function useClient(id: string) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
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
    if (id) fetchClient();
  }, [id]);

  return { client, loading, error, refresh: fetchClient };
}
