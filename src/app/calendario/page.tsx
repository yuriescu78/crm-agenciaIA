"use client";

import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CalendarioPage() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h2 className="nc-section-title">Planificación</h2>
          <h1 className="nc-section-name">Calendario</h1>
          <p className="nc-section-desc">Gestiona tus eventos, reuniones y hitos de proyectos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold bg-white shadow-sm text-primary-600">Mes</Button>
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-700">Semana</Button>
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-700">Día</Button>
          </div>
          <Button className="nc-btn nc-btn-primary h-11 px-6">
            <Plus size={18} className="mr-2" /> Agendar Evento
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="nc-card mb-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-extrabold text-neutral-900">Septiembre 2024</h3>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 text-neutral-400 hover:text-primary-500">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 text-neutral-400 hover:text-primary-500">
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button variant="ghost" className="h-9 px-4 rounded-lg text-[11px] font-bold text-primary-500 uppercase tracking-widest hover:bg-primary-50">Hoy</Button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reuniones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Hitos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Tareas</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="nc-card p-0 overflow-hidden border border-neutral-100">
        <div className="grid grid-cols-7 border-b border-neutral-100">
          {days.map(day => (
            <div key={day} className="px-4 py-3 bg-neutral-50/50 text-center">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em]">{day}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 grid-rows-5 h-[700px]">
          {Array.from({ length: 35 }).map((_, i) => {
            const isToday = i === 16;
            return (
              <div key={i} className={`border-r border-b border-neutral-100 p-3 hover:bg-neutral-50/50 transition-colors group cursor-pointer ${i % 7 === 6 ? 'border-r-0' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold ${isToday ? 'w-6 h-6 rounded-lg bg-primary-500 text-white flex items-center justify-center' : 'text-neutral-400'}`}>
                    {(i % 30) + 1}
                  </span>
                  {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                </div>
                
                {/* Events Samples */}
                {i === 16 && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 bg-amber-100 border-l-2 border-amber-500 rounded-md">
                      <p className="text-[10px] font-bold text-amber-700 truncate uppercase tracking-tighter">Demo Nexus V2</p>
                    </div>
                    <div className="px-2 py-1 bg-primary-100 border-l-2 border-primary-500 rounded-md">
                      <p className="text-[10px] font-bold text-primary-700 truncate uppercase tracking-tighter">Sync Equipo</p>
                    </div>
                  </div>
                )}
                {i === 18 && (
                  <div className="px-2 py-1 bg-violet-100 border-l-2 border-violet-500 rounded-md">
                    <p className="text-[10px] font-bold text-violet-700 truncate uppercase tracking-tighter">Review IA</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
