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
