"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  userProfile: { role: string; name: string } | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: User | null) => {
    if (!sessionUser) {
      setUserProfile(null);
      return;
    }
    const { data } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();
    if (data) {
      setUserProfile(data);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setUser(session?.user ?? null);
          await fetchProfile(session?.user ?? null);
        }
      } catch (err) {
        console.error('Error inicializando sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Set a safety timeout just in case Supabase hangs (3 seconds max)
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        console.warn('Auth init timeout reached, forcing load completion');
      }
    }, 3000);

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        try {
          await fetchProfile(session?.user ?? null);
        } catch (e) {
          console.error('Error fetching profile on auth change:', e);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
