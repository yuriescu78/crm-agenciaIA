import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function useOpportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    if (!user?.id) {
      setOpportunities([]);
      setLoading(false);
      return;
    }
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
        .eq('owner_id', user.id)
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
    fetchOpportunities();
  }, [user?.id]);

  return { opportunities, loading, error, refresh: fetchOpportunities };
}
