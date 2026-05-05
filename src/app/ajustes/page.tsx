"use client";

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
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = "force-dynamic";

export default function AjustesPage() {
  const sections = [
    { title: 'Perfil', icon: User, desc: 'Gestiona tu información personal y avatar.', color: 'text-primary-500', bg: 'bg-primary-100' },
    { title: 'Notificaciones', icon: Bell, desc: 'Configura cómo y qué alertas recibes.', color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Seguridad', icon: Shield, desc: 'Contraseñas, 2FA y sesiones activas.', color: 'text-violet-500', bg: 'bg-violet-100' },
    { title: 'Conexión CRM', icon: Database, desc: 'Tokens de Supabase y estados de red.', color: 'text-green-500', bg: 'bg-green-100' },
    { title: 'IA & Agentes', icon: Bot, desc: 'Configuración de Telegram y GPT-4o.', color: 'text-sky-500', bg: 'bg-sky-100' },
    { title: 'Apariencia', icon: Palette, desc: 'Temas, colores y modos de vista.', color: 'text-red-500', bg: 'bg-red-100' },
  ];

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
            <div key={i} className={`nc-card p-4 flex items-center justify-between cursor-pointer transition-all border-2 border-transparent hover:border-primary-500/10 group ${i === 0 ? 'bg-white shadow-lg ring-1 ring-neutral-200' : 'bg-neutral-50/50 shadow-none'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${sec.bg} ${sec.color}`}>
                  <sec.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 leading-tight">{sec.title}</h3>
                  <p className="text-[11px] font-bold text-neutral-400 mt-0.5 uppercase tracking-tight">{sec.desc.substring(0, 30)}...</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary-500 transition-colors" />
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="nc-card">
            <h3 className="text-lg font-extrabold text-neutral-900 mb-2">Información del Perfil</h3>
            <p className="text-[13px] text-neutral-500 mb-8">Esta información será visible para el resto del equipo en el workspace.</p>
            
            <div className="flex items-center gap-8 mb-10 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-500 to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white">
                  JR
                </div>
                <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl border border-neutral-200 shadow-md hover:bg-primary-50 hover:text-primary-600 transition-all text-neutral-500">
                  <Palette size={16} />
                </button>
              </div>
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="nc-label text-[10px]">Nombre Completo</label>
                    <input defaultValue="Juan Rodríguez" className="w-full h-10 px-4 rounded-xl border border-neutral-200 bg-white text-[13px] font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="nc-label text-[10px]">Email Profesional</label>
                    <input defaultValue="juan@agencia.com" className="w-full h-10 px-4 rounded-xl border border-neutral-200 bg-white text-[13px] font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="nc-label text-[10px]">Biografía de Usuario</label>
                  <textarea defaultValue="Director Creativo y Lead Developer en Nexus Agencia. Pasión por la IA y el diseño premium." className="w-full h-24 p-4 rounded-xl border border-neutral-200 bg-white text-[13px] font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
              <Button variant="outline" className="nc-btn nc-btn-secondary h-11 px-8">Cancelar</Button>
              <Button className="nc-btn nc-btn-primary h-11 px-8">Guardar Cambios</Button>
            </div>
          </div>

          <div className="nc-card border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900">Integración con Google</h3>
                <p className="text-[13px] text-neutral-500">Conecta la cuenta de la agencia para sincronizar calendarios y documentos.</p>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <LinkIcon size={20} className="text-blue-500" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 mb-1">Vincular cuenta elitoragenciaia@gmail.com</h4>
              <p className="text-[12px] text-neutral-500 mb-6 max-w-[400px]">Haz clic en el botón para autorizar al CRM a gestionar los eventos de Google Calendar y archivos de Google Drive.</p>
              
              <Button 
                onClick={() => window.location.href = '/api/auth/google'}
                className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold h-11 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /><path d="M0 0h24v24H0z" fill="none" /></svg>
                Conectar con Google
              </Button>
            </div>
          </div>

          <div className="nc-card bg-[oklch(0.09_0.02_250)] text-white border-none">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-md font-extrabold text-white">Estado de la Suscripción</h3>
                  <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider mt-1">Plan Agencia Enterprise</p>
                </div>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 rounded-xl h-10">
                  Mejorar Plan
                </Button>
             </div>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
                   <span>USO DE IA</span>
                   <span>85.4%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary-500 w-[85.4%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-3 font-medium">Próximo ciclo de facturación: 12 de Octubre, 2024</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
