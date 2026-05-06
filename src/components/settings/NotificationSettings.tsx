"use client";

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Bot, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  UserPlus,
  TrendingUp,
  Mail,
  Smartphone,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    in_app_enabled: true,
    telegram_enabled: false,
    on_new_client: true,
    on_task_assigned: true,
    on_opportunity_change: true,
    on_comment: true
  });
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // Force a maximum loading time of 3 seconds just in case
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      // Use getSession for speed and reliability
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        console.warn('NotificationSettings: No user session found');
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      // Parallel fetch to speed up things
      const [profileRes, telegramRes] = await Promise.all([
        supabase.from('users').select('notification_preferences').eq('id', user.id).maybeSingle(),
        supabase.from('telegram_users').select('id').eq('user_id', user.id).maybeSingle()
      ]);

      const profileData = profileRes.data;
      if (profileData?.notification_preferences) {
        setSettings(prev => ({ 
          ...prev, 
          ...(profileData.notification_preferences as any)
        }));
      }

      setIsTelegramLinked(!!telegramRes.data);

    } catch (error) {
      console.error('NotificationSettings: Global fetch error:', error);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error } = await supabase
        .from('users')
        .update({
          notification_preferences: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Ajustes guardados', {
        description: 'Tus preferencias de notificación han sido actualizadas.'
      });
    } catch (error: any) {
      toast.error('Error al guardar', {
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Cargando tus preferencias...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Telegram Status Banner */}
      {!isTelegramLinked && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-amber-900">Telegram no vinculado</h4>
            <p className="text-[12px] text-amber-700 mt-0.5">
              Para recibir alertas en tu móvil, vincula tu cuenta de Telegram en la sección "IA & Agentes".
            </p>
            <Link href="/telegram">
              <Button variant="ghost" className="p-0 h-auto text-[12px] font-black text-amber-600 mt-2 hover:text-amber-700">
                Vincular ahora <ChevronRight size={14} className="ml-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Settings Section */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Canales de Notificación</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Elige dónde quieres recibir tus alertas</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {/* In-App Notifs */}
          <div className="p-6 flex items-center justify-between group hover:bg-neutral-50/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-neutral-100 text-neutral-500 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-neutral-900">Alertas en el CRM</h4>
                <p className="text-[12px] text-neutral-500">Muestra la campana y el contador de notificaciones en la web.</p>
              </div>
            </div>
            <Switch 
              checked={settings.in_app_enabled} 
              onCheckedChange={() => handleToggle('in_app_enabled')}
            />
          </div>

          {/* Telegram Notifs */}
          <div className={cn(
            "p-6 flex items-center justify-between group transition-colors",
            !isTelegramLinked ? "opacity-50 grayscale cursor-not-allowed" : "hover:bg-neutral-50/30"
          )}>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-neutral-900">Mensajes de Telegram</h4>
                <p className="text-[12px] text-neutral-500">Recibe un mensaje instantáneo en tu móvil a través del bot.</p>
              </div>
            </div>
            <Switch 
              disabled={!isTelegramLinked}
              checked={settings.telegram_enabled && isTelegramLinked} 
              onCheckedChange={() => handleToggle('telegram_enabled')}
            />
          </div>
        </div>
      </div>

      {/* Events Selection Section */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Tipos de Eventos</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Personaliza qué eventos disparan alertas</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <UserPlus size={18} className="text-neutral-400" />
                <span className="text-[13px] font-bold text-neutral-700">Nuevo Cliente Creado</span>
              </div>
              <Switch checked={settings.on_new_client} onCheckedChange={() => handleToggle('on_new_client')} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-neutral-400" />
                <span className="text-[13px] font-bold text-neutral-700">Tarea Asignada / Vencida</span>
              </div>
              <Switch checked={settings.on_task_assigned} onCheckedChange={() => handleToggle('on_task_assigned')} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-neutral-400" />
                <span className="text-[13px] font-bold text-neutral-700">Cambio en el Pipeline</span>
              </div>
              <Switch checked={settings.on_opportunity_change} onCheckedChange={() => handleToggle('on_opportunity_change')} />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-neutral-400" />
                <span className="text-[13px] font-bold text-neutral-700">Comentarios y Notas</span>
              </div>
              <Switch checked={settings.on_comment} onCheckedChange={() => handleToggle('on_comment')} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="nc-btn nc-btn-primary h-11 px-10 shadow-lg shadow-primary-500/20"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : 'Guardar Preferencias'}
        </Button>
      </div>
    </div>
  );
}

// Add ChevronRight icon import since it was used in Link
function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
