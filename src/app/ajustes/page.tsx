"use client";

import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Link as LinkIcon, 
  Palette,
  Bot,
  ChevronRight,
  Globe,
  Mail,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AgentSettings } from '@/components/settings/AgentSettings';

export const dynamic = "force-dynamic";

export default function AjustesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('Perfil');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: ''
  });

  // Sincronizar el estado local con el perfil del contexto cuando cargue
  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || 'user'
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente', {
        description: 'Tus cambios se han sincronizado con el sistema.',
      });
    } catch (error: any) {
      toast.error('Error al guardar', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { title: 'Perfil', icon: User, desc: 'Información personal y avatar.', color: 'text-primary-500', bg: 'bg-primary-100' },
    { title: 'Google', icon: Globe, desc: 'Calendario y Drive de la agencia.', color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Notificaciones', icon: Bell, desc: 'Configura tus alertas.', color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Seguridad', icon: Shield, desc: 'Contraseñas y sesiones.', color: 'text-violet-500', bg: 'bg-violet-100' },
    { title: 'IA & Agentes', icon: Bot, desc: 'Telegram y modelos LLM.', color: 'text-sky-500', bg: 'bg-sky-100' },
  ];

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10">
        <h2 className="nc-section-title">Configuración del Sistema</h2>
        <h1 className="nc-section-name">Ajustes</h1>
        <p className="nc-section-desc">Personaliza tu espacio de trabajo y gestiona las preferencias globales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation List */}
        <div className="lg:col-span-1 space-y-3">
          {sections.map((sec, i) => (
            <div 
              key={i} 
              onClick={() => setActiveSection(sec.title)}
              className={cn(
                "nc-card p-4 flex items-center justify-between cursor-pointer transition-all border-2 group",
                activeSection === sec.title 
                  ? "bg-white border-primary-500/20 shadow-lg ring-1 ring-primary-500/5" 
                  : "bg-neutral-50/50 border-transparent shadow-none hover:border-neutral-200"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl", sec.bg, sec.color)}>
                  <sec.icon size={20} />
                </div>
                <div>
                  <h3 className={cn("text-sm font-extrabold leading-tight", activeSection === sec.title ? "text-primary-600" : "text-neutral-900")}>
                    {sec.title}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-400 mt-0.5 uppercase tracking-tight">{sec.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className={cn("transition-colors", activeSection === sec.title ? "text-primary-500" : "text-neutral-300 group-hover:text-neutral-400")} />
            </div>
          ))}

          {/* Botón de Diagnóstico */}
          <div className="pt-6">
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 border-neutral-200 text-neutral-400 text-[11px] font-black h-12 hover:border-primary-500 hover:text-primary-500 transition-all uppercase"
              onClick={async () => {
                const toastId = toast.loading('Diagnosticando conexión...');
                try {
                  const startTime = Date.now();
                  const { data, error } = await Promise.race([
                    supabase.from('users').select('count', { count: 'exact', head: true }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT: El servidor no responde')), 5000))
                  ]) as any;
                  
                  const duration = Date.now() - startTime;
                  
                  if (error) throw error;
                  toast.success('Conexión Exitosa', {
                    id: toastId,
                    description: `Respuesta en ${duration}ms. La base de datos está ONLINE.`,
                  });
                } catch (err: any) {
                  console.error("DIAGNOSTICO:", err);
                  toast.error('Fallo de Conexión', {
                    id: toastId,
                    description: err.message === 'TIMEOUT: El servidor no responde' 
                      ? 'El proyecto de Supabase parece estar PAUSADO o bloqueado.' 
                      : 'Error: ' + err.message,
                  });
                }
              }}
            >
              🩺 Diagnosticar Conexión
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {activeSection === 'Perfil' && (
            <div className="nc-card animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-extrabold text-neutral-900 mb-2">Información del Perfil</h3>
              <p className="text-[13px] text-neutral-500 mb-8">Esta información será visible para el resto del equipo.</p>
              
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-500 to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white">
                  {profile.name ? profile.name.substring(0, 2).toUpperCase() : '??'}
                </div>
                <div className="space-y-4 flex-1 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="nc-label text-[10px]">Nombre Completo</label>
                      <input 
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        style={{ color: '#000000' }} 
                        className="w-full h-10 px-4 rounded-xl border border-neutral-200 bg-white text-[13px] font-bold outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="nc-label text-[10px]">Email (Solo lectura)</label>
                      <input 
                        value={profile.email}
                        readOnly
                        style={{ color: '#666666' }} 
                        className="w-full h-10 px-4 rounded-xl border border-neutral-200 bg-neutral-50 text-[13px] font-bold outline-none cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="nc-btn nc-btn-primary h-11 px-8 min-w-[140px]"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                  ) : 'Guardar Perfil'}
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'Google' && (
            <div className="nc-card border-l-4 border-l-blue-500 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">Integración con Google</h3>
                  <p className="text-[13px] text-neutral-500">Conecta la cuenta de la agencia para sincronizar calendarios y documentos.</p>
                </div>
              </div>

              <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6">
                  <svg className="w-8 h-8" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                </div>
                <h4 className="text-md font-bold text-neutral-900 mb-2">Vincular elitoragenciaia@gmail.com</h4>
                <p className="text-[13px] text-neutral-500 mb-8 max-w-[450px]">
                  Al conectar, ELITOR.IA CRM podrá crear eventos en vuestro calendario y carpetas en Drive automáticamente.
                </p>
                
                <Button 
                  onClick={() => window.location.href = '/api/auth/google'}
                  className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold h-12 px-10 rounded-xl flex items-center gap-3 shadow-xl shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95"
                >
                  Conectar con Google
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'Notificaciones' && (
            <NotificationSettings />
          )}

          {activeSection === 'Seguridad' && (
            <SecuritySettings />
          )}

          {activeSection === 'IA & Agentes' && (
            <AgentSettings />
          )}

          {activeSection !== 'Perfil' && activeSection !== 'Google' && activeSection !== 'Notificaciones' && activeSection !== 'Seguridad' && activeSection !== 'IA & Agentes' && (
            <div className="nc-card py-20 text-center flex flex-col items-center justify-center">
               <div className="p-4 bg-neutral-100 text-neutral-400 rounded-full mb-4">
                  <Settings size={32} />
               </div>
               <h3 className="text-md font-bold text-neutral-900">Sección en construcción</h3>
               <p className="text-[13px] text-neutral-500 mt-1">Próximamente disponible en la versión beta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
