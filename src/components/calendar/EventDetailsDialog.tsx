"use client";

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  AlignLeft, 
  ExternalLink,
  User,
  Trash2,
  Edit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventDetailsDialogProps {
  event: any;
  children?: React.ReactNode;
  onEventUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventDetailsDialog({ 
  event, 
  children, 
  onEventUpdated, 
  open: externalOpen, 
  onOpenChange: setExternalOpen,
  onEdit,
  onDelete
}: EventDetailsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (setExternalOpen) setExternalOpen(val);
    setInternalOpen(val);
  };

  const startTime = event.startAt ? new Date(event.startAt) : null;
  const endTime = event.endAt ? new Date(event.endAt) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger 
          render={children}
          nativeButton={false}
        />
      )}
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <CalendarIcon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Detalles del Evento</span>
          </div>
          <DialogTitle className="text-2xl font-black text-foreground leading-tight">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fecha y Hora */}
          <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground capitalize">
                {startTime ? format(startTime, "EEEE, d 'de' MMMM", { locale: es }) : 'Fecha no disponible'}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {startTime && format(startTime, "HH:mm")} - {endTime && format(endTime, "HH:mm")}
              </p>
            </div>
          </div>

          {/* Cliente (Si está disponible) */}
          {event.clientName && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <User size={12} /> Cliente
              </label>
              <div className="p-3 rounded-lg bg-background border border-border flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">{event.clientName}</span>
                <Button variant="ghost" size="xs" className="text-primary hover:bg-primary/5">Ver Ficha</Button>
              </div>
            </div>
          )}

          {/* Descripción */}
          {event.description && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1">
                <AlignLeft size={12} /> Descripción
              </label>
              <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {/* Nota sobre Google */}
          <div className="pt-2">
            <p className="text-[10px] text-center text-muted-foreground italic">
              Este evento está sincronizado con Google Calendar
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-3 sm:justify-between w-full">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10" 
              title="Eliminar"
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="text-muted-foreground hover:text-primary" 
              title="Editar"
              onClick={onEdit}
            >
              <Edit size={16} />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(event.link, '_blank')} className="gap-2">
              <ExternalLink size={14} /> Abrir en Google
            </Button>
            <Button variant="default" size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
