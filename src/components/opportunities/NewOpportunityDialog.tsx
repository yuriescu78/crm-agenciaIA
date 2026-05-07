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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NewOpportunityDialog({ 
  onOpportunityCreated,
  open: externalOpen,
  onOpenChange: setExternalOpen,
  hideTrigger = false,
  children
}: { 
  onOpportunityCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  children?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;
  
  const { clients, loading: loadingClients } = useClients();
  const { users, loading: loadingUsers } = useUsers();
  
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    estimated_value: '',
    probability: '50',
    stage: 'Nuevo lead',
    description: '',
    owner_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert("Por favor, selecciona un cliente");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('opportunities')
        .insert([{
          client_id: formData.client_id,
          title: formData.title,
          estimated_value: parseFloat(formData.estimated_value) || 0,
          probability: parseInt(formData.probability) || 0,
          stage: formData.stage,
          description: formData.description,
          owner_id: formData.owner_id || null
        }]);

      if (error) throw error;
      
      setOpen(false);
      setFormData({
        client_id: '',
        title: '',
        estimated_value: '',
        probability: '50',
        stage: 'Nuevo lead',
        description: '',
        owner_id: ''
      });
      if (onOpportunityCreated) onOpportunityCreated();
    } catch (err: any) {
      console.error("Error creating opportunity:", err);
      const errorMessage = err?.message || "Error desconocido";
      alert(`Error al crear la oportunidad: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const trigger = children || (
    <Button>
      <Plus size={16} className="mr-2" /> Nueva Oportunidad
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger render={trigger as React.ReactElement} nativeButton={true} />}
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-border shadow-2xl bg-card rounded-md">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-xl font-bold text-foreground">Añadir Nueva Oportunidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="bg-card">
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cliente</label>
              <Select 
                key={clients.length > 0 ? 'loaded' : 'loading'}
                value={formData.client_id} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, client_id: val || '' }))}
              >
                <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Selecciona un cliente"}>
                    {formData.client_id && clients.length > 0 ? (
                      (() => {
                        const c = clients.find(c => c.id === formData.client_id);
                        return c ? c.company : undefined;
                      })()
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {loadingClients ? (
                    <div className="p-4 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Cargando clientes...
                    </div>
                  ) : clients.length === 0 ? (
                    <div className="p-4 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      No hay clientes registrados
                    </div>
                  ) : (
                    clients.map(client => (
                      <SelectItem key={client.id} value={client.id} className="focus:bg-primary/10 focus:text-primary">
                        <div className="flex flex-col">
                          <span className="font-bold">{client.company}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Título de la Oportunidad</label>
              <Input 
                placeholder="Ej: Implantación de CRM" 
                required 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
                className="h-11 rounded bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Socio Responsable</label>
              <Select 
                value={formData.owner_id || "none"} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, owner_id: (val === 'none' || !val) ? '' : val }))}
              >
                <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Selecciona responsable">
                    {users.find(u => u.id === formData.owner_id)?.name}
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
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Probabilidad de Éxito (%)</label>
              <Input 
                type="number" 
                placeholder="Ej: 50" 
                min="0" 
                max="100" 
                value={formData.probability}
                onChange={(e) => setFormData(prev => ({ ...prev, probability: (e.target as HTMLInputElement).value }))}
                className="h-11 rounded bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Etapa Inicial</label>
              <Select 
                value={formData.stage} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, stage: val || 'Nuevo lead' }))}
              >
                <SelectTrigger className="h-11 rounded bg-background border-border text-foreground focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Selecciona etapa" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="Nuevo lead" className="focus:bg-primary/10 focus:text-primary">Nuevo lead</SelectItem>
                  <SelectItem value="Contactado" className="focus:bg-primary/10 focus:text-primary">Contactado</SelectItem>
                  <SelectItem value="Reunión agendada" className="focus:bg-primary/10 focus:text-primary">Reunión agendada</SelectItem>
                  <SelectItem value="Diagnóstico" className="focus:bg-primary/10 focus:text-primary">Diagnóstico</SelectItem>
                  <SelectItem value="Propuesta en preparación" className="focus:bg-primary/10 focus:text-primary">Propuesta en preparación</SelectItem>
                  <SelectItem value="Propuesta enviada" className="focus:bg-primary/10 focus:text-primary">Propuesta enviada</SelectItem>
                  <SelectItem value="Negociación" className="focus:bg-primary/10 focus:text-primary">Negociación</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? 'Creando...' : 'Crear Oportunidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
