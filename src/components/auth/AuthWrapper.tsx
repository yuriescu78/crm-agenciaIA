"use client";

import { useAuth } from '@/lib/auth-context';
import { LoginScreen } from './LoginScreen';
import { Loader2 } from 'lucide-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Iniciando ELITOR.IA CRM...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
