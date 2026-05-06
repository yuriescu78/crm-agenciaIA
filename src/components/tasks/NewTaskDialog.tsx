import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from '@/lib/supabase';
import { useClients } from '@/hooks/useClients';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
export function NewTaskDialog({ 
  onTaskCreated,
  open: externalOpen,
  onOpenChange: setExternalOpen,
  hideTrigger = false,
  children,
  task
}: { 
  onTaskCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  children?: React.ReactNode;
  task?: any;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;
  
  const { clients } = useClients();
  const { users } = useUsers();
  
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    priority: 'Media',
    due_date: '',
    status: 'Pendiente',
    progress: 0,
    estimated_value: 0,
    assigned_to: ''
  });

  useEffect(() => {
    if (task && open) {
      setFormData({
        client_id: task.client_id || '',
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Media',
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
        status: task.status || 'Pendiente',
        progress: task.progress || 0,
        estimated_value: task.estimated_value || 0,
        assigned_to: task.assigned_to || ''
      });
    } else if (!task && open) {
      setFormData({
        client_id: '',
        title: '',
        description: '',
        priority: 'Media',
        due_date: '',
        status: 'Pendiente',
        progress: 0,
        estimated_value: 0,
        assigned_to: ''
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let dueDateIso = null;
      if (formData.due_date && formData.due_date.trim() !== "") {
        const d = new Date(formData.due_date);
        if (!isNaN(d.getTime())) {
          dueDateIso = d.toISOString();
        }
      }

      const payload = {
        client_id: formData.client_id || null,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        progress: formData.progress,
        estimated_value: formData.estimated_value,
        due_date: dueDateIso,
        assigned_to: formData.assigned_to || null
      };

      let error: any;
      if (task?.id) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', task.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      
      setOpen(false);
      if (onTaskCreated) onTaskCreated();
    } catch (err: any) {
      console.error("Error al procesar tarea:", err);
      alert(`Error: ${err.message || "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  const trigger = children || (
    <Button>
      <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger render={trigger as React.ReactElement} nativeButton={!children} />}
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border shadow-2xl bg-card rounded-md">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-xl font-bold text-foreground">
            {task ? 'Editar Trabajo' : 'Añadir Nuevo Trabajo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="bg-card">
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Título de la Tarea</label>
              <Input 
                placeholder="Ej: Llamar cliente para seguimiento" 
                required 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
                className="h-11 rounded bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Asociar a Cliente (Opcional)</label>
              <Select 
                value={formData.client_id} 
                onValueChange={(val: string | null) => { if (val) setFormData(prev => ({ ...prev, client_id: val })); }}
              >
                <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
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
                      {client.first_name} {client.last_name} ({client.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Socio Asignado</label>
                <Select 
                  value={formData.assigned_to || "none"} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, assigned_to: val === 'none' ? '' : val }))}
                >
                  <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Sin asignar">
                      {users.find(u => u.id === formData.assigned_to)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="none" className="focus:bg-primary/10 focus:text-primary font-medium">Sin asignar</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id} className="focus:bg-primary/10 focus:text-primary font-medium">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Estado</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: string | null) => { if (val) setFormData(prev => ({ ...prev, status: val })); }}
                >
                  <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="Pendiente" className="focus:bg-primary/10 focus:text-primary">Pendiente</SelectItem>
                    <SelectItem value="En curso" className="focus:bg-primary/10 focus:text-primary">En curso</SelectItem>
                    <SelectItem value="Revisión" className="focus:bg-primary/10 focus:text-primary">Revisión</SelectItem>
                    <SelectItem value="Completada" className="focus:bg-primary/10 focus:text-primary">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Prioridad</label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(val: string | null) => { if (val) setFormData(prev => ({ ...prev, priority: val })); }}
                >
                  <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="Baja" className="focus:bg-primary/10 focus:text-primary">Baja</SelectItem>
                    <SelectItem value="Media" className="focus:bg-primary/10 focus:text-primary">Media</SelectItem>
                    <SelectItem value="Alta" className="focus:bg-primary/10 focus:text-primary">Alta</SelectItem>
                    <SelectItem value="Urgente" className="focus:bg-primary/10 focus:text-primary">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Valor Estimado (€)</label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={formData.estimated_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: parseFloat((e.target as HTMLInputElement).value) || 0 }))}
                  className="h-11 rounded bg-background border-border text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Progreso (%)</label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0" 
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt((e.target as HTMLInputElement).value) || 0 }))}
                  className="h-11 rounded bg-background border-border text-foreground focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Fecha Límite</label>
              <Input 
                type="date" 
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: (e.target as HTMLInputElement).value }))}
                className="h-11 rounded bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary [color-scheme:dark]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Descripción</label>
              <textarea 
                className={cn(
                  "w-full min-h-[100px] rounded border border-border bg-background px-3 py-2.5 text-[13px] font-medium text-foreground transition-all placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                  "scrollbar-hide resize-none"
                )}
                placeholder="Detalles sobre el proyecto o necesidad"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 bg-muted/10 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-muted-foreground hover:text-foreground hover:bg-muted font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:brightness-110 font-bold px-6 shadow-lg shadow-primary/20">
              {loading ? 'Guardando...' : task ? 'Guardar Cambios' : 'Crear Trabajo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
