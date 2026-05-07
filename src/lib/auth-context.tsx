"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  userProfile: { role: string; name: string; email: string } | null;
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
    const { data } = await supabase.from('users').select('role, name, email').eq('id', sessionUser.id).single();
    if (data) {
      setUserProfile(data);
    } else {
      // Fallback profile if user record doesn't exist yet
      setUserProfile({
        name: sessionUser.email?.split('@')[0] || 'Usuario',
        email: sessionUser.email || '',
        role: 'admin' // Default to admin in production if profile missing to avoid lockout
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async (retryCount = 0) => {
      const startTime = Date.now();
      console.log(`AUTH: Intento ${retryCount + 1} de verificación de sesión...`);
      
      try {
        // Usamos una promesa con timeout para cada intento individual
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_INDIVIDUAL')), 5000)
        );

        const { data, error }: any = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) throw error;
        
        const duration = Date.now() - startTime;
        console.log(`AUTH: Sesión verificada en ${duration}ms.`, data.session ? "Usuario detectado." : "No hay sesión.");
        
        if (mounted) {
          setUser(data.session?.user ?? null);
          await fetchProfile(data.session?.user ?? null);
          setLoading(false);
        }
      } catch (err: any) {
        console.error(`AUTH: Fallo en intento ${retryCount + 1}:`, err.message);
        
        if (retryCount < 2 && mounted) {
          const delay = (retryCount + 1) * 2000;
          console.log(`AUTH: Reintentando en ${delay}ms...`);
          setTimeout(() => initAuth(retryCount + 1), delay);
        } else if (mounted) {
          console.error('AUTH: Todos los reintentos fallaron.');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Timeout global de seguridad más largo
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        console.warn('AUTH: Tiempo de espera global agotado. Mostrando estado offline/invitado.');
      }
    }, 20000);

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
