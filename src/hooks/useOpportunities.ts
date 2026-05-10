import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useOpportunities() {
  const { user, loading: authLoading } = useAuth();
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
      console.error("Error fetching opportunities:", err);
      setError(err.message);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchOpportunities();
  }, [authLoading, user?.id]);

  return { opportunities, loading, error, refresh: fetchOpportunities };
}
