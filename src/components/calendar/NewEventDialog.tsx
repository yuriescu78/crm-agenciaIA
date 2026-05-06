"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, Plus, Calendar as CalendarIcon, Clock, AlignLeft, User } from 'lucide-react';
import { createGoogleEventAction, updateGoogleEventAction } from '@/app/calendario/actions';
import { supabase } from '@/lib/supabase';
import { useClients } from '@/hooks/useClients';
import { cn } from '@/lib/utils';

interface NewEventDialogProps {
  children?: React.ReactNode;
  onEventCreated?: () => void;
  defaultDate?: Date;
  event?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewEventDialog({ children, onEventCreated, defaultDate, event, open: externalOpen, onOpenChange: setExternalOpen }: NewEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (setExternalOpen) setExternalOpen(val);
    setInternalOpen(val);
  };

  const [loading, setLoading] = useState(false);
  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeFromISO = (isoString: string) => {
    if (!isoString) return '09:00';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const { clients } = useClients();

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    client_id: event?.clientId || '',
    date: event?.startAt ? formatDateToLocalISO(new Date(event.startAt)) : (defaultDate ? formatDateToLocalISO(defaultDate) : formatDateToLocalISO(new Date())),
    startTime: event?.startAt ? formatTimeFromISO(event.startAt) : '09:00',
    endTime: event?.endAt ? formatTimeFromISO(event.endAt) : '10:00',
  });

  // Sync with event prop if it changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        client_id: event.clientId || '',
        date: event.startAt ? formatDateToLocalISO(new Date(event.startAt)) : formatDateToLocalISO(new Date()),
        startTime: formatTimeFromISO(event.startAt),
        endTime: formatTimeFromISO(event.endAt),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        client_id: '',
        date: defaultDate ? formatDateToLocalISO(defaultDate) : formatDateToLocalISO(new Date()),
        startTime: '09:00',
        endTime: '10:00',
      });
    }
  }, [event, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      // Format start and end as ISO datetime for Europe/Madrid (Google Calendar handles timezone with explicit string or default)
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();

      let result;
      if (event?.id) {
        result = await updateGoogleEventAction(event.id, {
          title: formData.title,
          description: formData.description,
          startAt,
          endAt
        });
      } else {
        result = await createGoogleEventAction({
          title: formData.title,
          description: formData.description,
          startAt,
          endAt
        });
      }

      if (result.success) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (event?.id) {
          // Update local
          await supabase.from('calendar_events')
            .update({
              title: formData.title,
              description: formData.description,
              client_id: formData.client_id || null,
              start_at: startAt,
              end_at: endAt,
            })
            .eq('id', event.localId || ''); // Use localId if available
        } else {
          // Create local
          const eventPayload: any = {
            title: formData.title,
            description: formData.description,
            client_id: formData.client_id || null,
            start_at: startAt,
            end_at: endAt,
            status: 'Agendada',
            type: 'Cita CRM'
          };

          if (user?.id) {
            eventPayload.owner_id = user.id;
            eventPayload.created_by = user.id;
          }
          
          await supabase.from('calendar_events').insert([eventPayload]);
        }

        // 3. Automatización: Mover en el Pipeline si hay cliente seleccionado
        if (formData.client_id) {
          await supabase
            .from('opportunities')
            .update({ stage: 'Reunión agendada' })
            .eq('client_id', formData.client_id)
            .in('stage', ['Nuevo lead', 'Contactado']);
        }

        toast.success(event?.id ? 'Evento actualizado' : 'Evento creado y sincronizado');
        setOpen(false);
        if (onEventCreated) onEventCreated();
      }
    } catch (error) {
      console.error(error);
      toast.error('Error inesperado al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger 
          render={children as React.ReactElement}
          nativeButton={false}
        />
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {event?.id ? 'Editar Evento' : 'Nuevo Evento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-8 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Título del evento</label>
            <Input 
              value={formData.title}
              onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
              placeholder="Ej: Reunión con cliente"
              className="h-11 bg-muted/40 border-border focus:bg-background focus:border-primary transition-all duration-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <User size={12}/> Cliente Asociado (Opcional)
            </label>
            <Select 
              value={formData.client_id} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, client_id: (val === 'none' || !val) ? '' : val }))}
            >
              <SelectTrigger className="h-11 bg-muted/40 border-border focus:bg-background focus:border-primary transition-all duration-200">
                <SelectValue placeholder="Selecciona un cliente">
                  {formData.client_id && clients.find(c => c.id === formData.client_id) 
                    ? `${clients.find(c => c.id === formData.client_id)?.first_name} ${clients.find(c => c.id === formData.client_id)?.last_name}`
                    : "Ninguno"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="none" className="focus:bg-primary/10 focus:text-primary">Ninguno</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id} className="focus:bg-primary/10 focus:text-primary">
                    {client.first_name} {client.last_name} {client.company ? `(${client.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><CalendarIcon size={12}/> Fecha</label>
              <Input 
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                className="h-11 bg-muted/40 border-border focus:bg-background focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Inicio</label>
              <Input 
                type="time"
                value={formData.startTime}
                onChange={e => setFormData(prev => ({...prev, startTime: e.target.value}))}
                className="h-11 bg-muted/40 border-border focus:bg-background focus:border-primary transition-all duration-200"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Fin</label>
              <Input 
                type="time"
                value={formData.endTime}
                onChange={e => setFormData(prev => ({...prev, endTime: e.target.value}))}
                className="h-11 bg-muted/40 border-border focus:bg-background focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><AlignLeft size={12}/> Descripción (opcional)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
              className="w-full min-h-[100px] p-4 rounded-xl bg-muted/40 border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:bg-background text-sm text-foreground resize-none transition-all duration-200 outline-none"
              placeholder="Añade detalles sobre el evento..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="px-6 shadow-md shadow-primary/20 hover:shadow-primary/40">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {event?.id ? 'Actualizando...' : 'Creando...'}</> : (event?.id ? 'Guardar Cambios' : 'Guardar en Google')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
