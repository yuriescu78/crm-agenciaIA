"use client";

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Activity, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchGoogleEventsAction } from './calendario/actions';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [actividad, setActividad] = useState<any[]>([]);
  const [calendario, setCalendario] = useState<any[]>([]);
  const [tareasHoy, setTareasHoy] = useState<any[]>([]);
  const [urgente, setUrgente] = useState<any[]>([]);

  useEffect(() => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Actividad Reciente (Notas de clientes)
        const { data: notasData } = await supabase
          .from('client_notes')
          .select('*, clients(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(5);
          
        // 2. Próximas fechas calendario (Local + Google)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data: localCalendarData } = await supabase
          .from('calendar_events')
          .select('*')
          .gte('start_at', startOfToday.toISOString())
          .order('start_at', { ascending: true })
          .limit(5);

        let allEvents = localCalendarData || [];

        try {
          const googleEvents = await fetchGoogleEventsAction(
            startOfToday.toISOString(),
            addDays(new Date(), 90).toISOString()
          );
          
          const mappedGoogle = googleEvents.map((e: any) => ({
            id: e.id,
            title: e.title,
            start_at: e.startAt,
            type: 'Google',
            is_google: true
          }));

          allEvents = [...allEvents, ...mappedGoogle]
            .filter(e => e.start_at)
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .slice(0, 10);
        } catch (error) {
          console.error("Error fetching google events", error);
        }

        // 3. Tareas de hoy
        const { data: todayTasksData } = await supabase
          .from('tasks')
          .select('*, clients(first_name, last_name)')
          .gte('due_date', todayStart.toISOString())
          .lte('due_date', todayEnd.toISOString())
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(5);

        // 4. Lo más urgente
        const { data: urgentTasksData } = await supabase
          .from('tasks')
          .select('*, clients(first_name, last_name)')
          .eq('priority', 'Alta')
          .neq('status', 'Completada')
          .order('due_date', { ascending: true })
          .limit(5);

        if (notasData) setActividad(notasData);
        setCalendario(allEvents);
        if (todayTasksData) setTareasHoy(todayTasksData);
        if (urgentTasksData) setUrgente(urgentTasksData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }

    fetchDashboardData();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return `Hoy, ${format(date, 'HH:mm')}`;
    if (isTomorrow(date)) return `Mañana, ${format(date, 'HH:mm')}`;
    return format(date, "d MMM, HH:mm", { locale: es });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Panel de Control</h1>
          <p className="text-muted-foreground text-[14px] font-medium capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <p className="text-muted-foreground text-[13px] font-medium hidden md:block italic bg-muted/30 px-3 py-1 rounded-full border border-border/50">
          Bienvenido de nuevo, {format(new Date(), "HH:mm")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* 1. Actividad Reciente */}
        <Card className="rounded-xl bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Activity size={18} />
              </div>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
              </div>
            ) : actividad.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Activity size={32} className="opacity-20 mb-3" />
                <p className="text-sm">No hay actividad reciente registrada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actividad.map((nota, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs shrink-0">
                      {nota.clients?.first_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground line-clamp-2">{nota.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-bold text-blue-400">{nota.clients?.first_name} {nota.clients?.last_name}</span>
                        <span className="text-[10px] text-muted-foreground">• {formatEventDate(nota.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Próximas Fechas Calendario */}
        <Card className="rounded-xl bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <CalendarIcon size={18} />
              </div>
              <CardTitle className="text-lg">Próximas Fechas</CardTitle>
            </div>
            <Link href="/calendario" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center">
              Ver todo <ArrowRight size={12} className="ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
              </div>
            ) : calendario.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <CalendarIcon size={32} className="opacity-20 mb-3" />
                <p className="text-sm">No tienes eventos próximos en el calendario.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calendario.map((evento, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[14px] text-foreground">{evento.title}</h4>
                        <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock size={12} /> {formatEventDate(evento.start_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "bg-background text-muted-foreground capitalize text-[10px]",
                      evento.is_google && "text-blue-400 border-blue-400/30 bg-blue-500/5"
                    )}>
                      {evento.type || 'Evento'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Las Tareas de Hoy */}
        <Card className="rounded-xl bg-card border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <CheckSquare size={18} />
              </div>
              <CardTitle className="text-lg">Tareas de Hoy</CardTitle>
            </div>
            <Link href="/tareas" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center">
              Ir a trabajos <ArrowRight size={12} className="ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
              </div>
            ) : tareasHoy.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <CheckSquare size={32} className="opacity-20 mb-3" />
                <p className="text-sm">No tienes tareas programadas para hoy.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tareasHoy.map((tarea, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-muted-foreground/30" />
                      <div>
                        <h4 className="font-bold text-[14px] text-foreground">{tarea.title}</h4>
                        {tarea.clients && (
                          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {tarea.clients.first_name} {tarea.clients.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Lo Más Urgente */}
        <Card className="rounded-xl bg-card border-border shadow-sm flex flex-col border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                <AlertCircle size={18} />
              </div>
              <CardTitle className="text-lg">Lo Más Urgente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
              </div>
            ) : urgente.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <AlertCircle size={32} className="opacity-20 mb-3" />
                <p className="text-sm">No hay elementos urgentes (Alta Prioridad) pendientes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgente.map((tarea, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-[14px] text-foreground flex items-center gap-2">
                        {tarea.title}
                      </h4>
                      {tarea.clients && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                          {tarea.clients.first_name} {tarea.clients.last_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-none px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Urgente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
