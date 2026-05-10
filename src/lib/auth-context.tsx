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

  // fetchProfile SIEMPRE resuelve en max 5s — nunca cuelga ni lanza excepción
  const fetchProfile = async (sessionUser: User | null) => {
    if (!sessionUser) { setUserProfile(null); return; }

    const fallback = {
      name: sessionUser.email?.split('@')[0] || 'Usuario',
      email: sessionUser.email || '',
      role: 'admin',
    };

    try {
      const result = await Promise.race([
        supabase.from('profiles').select('role, name, email').eq('id', sessionUser.id).single(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000)),
      ]);
      const { data } = result as any;
      setUserProfile(data || fallback);
    } catch {
      setUserProfile(fallback);
    }
  };

  // signOutClean tiene timeout de 3s para funcionar aunque Supabase esté caído
  const signOutClean = async () => {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>(resolve => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // ignorar — siempre redirigir
    }
    window.location.href = '/';
  };

  useEffect(() => {
    let mounted = true;

    // Safety net: si initAuth no resuelve en 8s por cualquier motivo, desbloquear la UI
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    const initAuth = async () => {
      try {
        // Comprobar inactividad persistida en localStorage
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT_MS) {
          clearTimeout(safetyTimer);
          await signOutClean();
          return;
        }

        // getSession() lee localStorage sin red — rápido y resiliente
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user); // siempre resuelve ≤ 5s
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          }
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          clearTimeout(safetyTimer);
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // onAuthStateChange: TOKEN_REFRESHED, SIGNED_OUT, SIGNED_IN, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } else if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user); // siempre resuelve ≤ 5s
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Inactivity timeout — persiste timestamp en localStorage para sobrevivir recargas
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
