"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .order('name');
        
        if (error) {
          console.error('Supabase Error details:', error);
          throw new Error(error.message);
        }
        setUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching users:', err.message || err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading };
}
