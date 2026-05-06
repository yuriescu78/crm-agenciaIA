"use client";

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchGoogleEventsAction } from './actions';
import { toast } from 'sonner';
import { NewEventDialog } from '@/components/calendar/NewEventDialog';
import { EventDetailsDialog } from '@/components/calendar/EventDetailsDialog';

export default function CalendarioPage() {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Month logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  let firstDayOfMonth = new Date(year, month, 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const timeMin = new Date(year, month - 1, 1).toISOString();
      const timeMax = new Date(year, month + 2, 0).toISOString();
      const fetchedEvents = await fetchGoogleEventsAction(timeMin, timeMax);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast.error('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [month, year]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    const day = daysInPrevMonth - firstDayOfMonth + i + 1;
    calendarCells.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  const totalCells = calendarCells.length > 35 ? 42 : 35;
  const remainingCells = totalCells - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const eventDate = new Date(e.startAt);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsNewEventOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleEditEvent = () => {
    setIsDetailsOpen(false);
    setTimeout(() => setIsNewEventOpen(true), 100);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;
    
    try {
      const { deleteGoogleEventAction } = await import('./actions');
      const res = await deleteGoogleEventAction(selectedEvent.id);
      
      if (res.success) {
        const { supabase } = await import('@/lib/supabase');
        await supabase.from('calendar_events').delete().eq('id', selectedEvent.localId || '');
        toast.success('Evento eliminado');
        setIsDetailsOpen(false);
        fetchEvents();
      } else {
        toast.error('Error al eliminar: ' + res.error);
      }
    } catch (error) {
      toast.error('Error inesperado al eliminar');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Diálogos Globales */}
      <NewEventDialog 
        open={isNewEventOpen} 
        onOpenChange={setIsNewEventOpen}
        defaultDate={selectedDate}
        event={selectedEvent}
        onEventCreated={fetchEvents}
      />

      {selectedEvent && (
        <EventDetailsDialog 
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          event={selectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h2 className="nc-section-title">Planificación</h2>
          <h1 className="nc-section-name">Calendario</h1>
          <p className="nc-section-desc">Gestiona tus eventos sincronizados con Google Calendar.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold bg-white shadow-sm text-primary-600">Mes</Button>
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-700">Semana</Button>
            <Button variant="ghost" className="h-9 px-4 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-700">Día</Button>
          </div>
          <Button variant="outline" className="h-11 px-4 text-neutral-600" onClick={() => window.open('https://calendar.google.com', '_blank')}>
            <ExternalLink size={18} className="md:mr-2" /> <span className="hidden md:inline">Google Calendar</span>
          </Button>
          <Button onClick={() => { setSelectedEvent(null); setSelectedDate(new Date()); setIsNewEventOpen(true); }} className="nc-btn nc-btn-primary">
            <Plus size={18} className="mr-2" /> Agendar Evento
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="nc-card mb-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-extrabold text-neutral-900 capitalize">{monthNames[month]} {year}</h3>
          <div className="flex gap-1">
            <Button onClick={prevMonth} variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 text-neutral-400 hover:text-primary-500">
              <ChevronLeft size={18} />
            </Button>
            <Button onClick={nextMonth} variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 text-neutral-400 hover:text-primary-500">
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button onClick={goToday} variant="ghost" className="h-9 px-4 rounded-lg text-[11px] font-bold text-primary-500 uppercase tracking-widest hover:bg-primary-50">Hoy</Button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Eventos Google</span>
          </div>
          {loading && <span className="text-[11px] font-bold text-primary-500 animate-pulse">Sincronizando...</span>}
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
        
        <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${totalCells / 7}, minmax(140px, 1fr))` }}>
          {calendarCells.map((cell, i) => {
            const today = isToday(cell.date);
            const dayEvents = getEventsForDate(cell.date);
            
            return (
              <div 
                key={i} 
                onClick={() => handleDayClick(cell.date)}
                className={`border-r border-b border-border p-2 hover:bg-muted/50 transition-colors group relative h-full min-h-[140px] flex flex-col cursor-pointer ${i % 7 === 6 ? 'border-r-0' : ''} ${!cell.isCurrentMonth ? 'bg-muted/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${today ? 'bg-primary text-primary-foreground shadow-md' : (cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground')}`}>
                    {cell.day}
                  </span>
                  {today && <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1 mt-2 animate-pulse" />}
                </div>
                
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto scrollbar-hide flex-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      className="px-2 py-1 bg-primary/10 border-l-2 border-primary rounded-r-sm hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <p className="text-[10px] font-bold text-foreground truncate">{event.title}</p>
                      {event.startAt && event.startAt.includes('T') && (
                        <p className="text-[9px] font-medium text-muted-foreground">
                          {new Date(event.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
