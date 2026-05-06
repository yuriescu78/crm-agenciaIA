"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' 
        ? 'Credenciales incorrectas. Verifica tu email y contraseña.' 
        : authError.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl mb-6">
            <Lock className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Acceso a ELITOR.IA</h1>
          <p className="text-muted-foreground font-medium">Panel de gestión estratégica para socios</p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[13px] font-bold text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email de Socio</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="socio@agencia.com"
                    required
                    className="h-14 pl-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-14 pl-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-xl font-black text-[15px] bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
            >
              {loading ? 'Verificando...' : 'Entrar al CRM'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[12px] font-bold text-muted-foreground mt-8">
          Si no tienes acceso, contacta con el administrador del sistema.
        </p>
      </div>
    </div>
  );
}
