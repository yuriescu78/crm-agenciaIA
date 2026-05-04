import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from('opportunities')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company
          )
        `)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setOpportunities(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return { opportunities, loading, error, refresh: fetchOpportunities };
}
