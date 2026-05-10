"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 horas
const LAST_ACTIVITY_KEY = 'elitor_last_activity';

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
    const { data } = await supabase.from('profiles').select('role, name, email').eq('id', sessionUser.id).single();
    if (data) {
      setUserProfile(data);
    } else {
      setUserProfile({
        name: sessionUser.email?.split('@')[0] || 'Usuario',
        email: sessionUser.email || '',
        role: 'admin',
      });
    }
  };

  const signOutClean = async () => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Si hay registro de actividad previa, verificar que no haya expirado por inactividad
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          if (elapsed > INACTIVITY_LIMIT_MS) {
            // Inactividad superada entre sesiones del navegador → cerrar sesión
            await signOutClean();
            return;
          }
        }

        // getUser() valida el token con el servidor Supabase (a diferencia de getSession()
        // que solo lee localStorage sin verificar si el JWT sigue siendo válido)
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        );

        const { data: { user: validatedUser }, error } = await Promise.race([userPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

        if (error || !validatedUser) {
          // Sesión inválida o expirada — limpiar y mostrar login
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(validatedUser);
          await fetchProfile(validatedUser);
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          setLoading(false);
        }
      } catch {
        // Timeout u otro error de red — mostrar login sin sesión
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Escuchar cambios de sesión (TOKEN_REFRESHED, SIGNED_OUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } else if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user).catch(console.error);
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Inactivity timeout — resetea el timestamp en localStorage con cada interacción
  // para que persista aunque el usuario cierre y reabra el navegador
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(signOutClean, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
