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

  // signOutClean tiene timeout de 3s para que funcione aunque Supabase esté caído
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

    const initAuth = async () => {
      try {
        // Comprobar inactividad entre sesiones del navegador (persiste en localStorage)
        const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT_MS) {
          await signOutClean();
          return;
        }

        // getSession() lee localStorage sin red — resiliente a Supabase caído
        // El cliente Supabase renueva el JWT automáticamente al hacer queries
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user);
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          }
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // onAuthStateChange gestiona: SIGNED_OUT (token inválido), TOKEN_REFRESHED, etc.
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

  // Inactivity timeout — persiste el timestamp en localStorage con cada interacción
  // para que el límite de 2h sobreviva cierres y reaperturas del navegador
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
