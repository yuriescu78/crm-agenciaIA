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
      console.error("Error fetching opportunities:", err);
      setError(err.message);
      setOpportunities([]); // Clear on error to avoid stale data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("Forcing loading false after 5s timeout in useOpportunities");
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, []);

  return { opportunities, loading, error, refresh: fetchOpportunities };
}
