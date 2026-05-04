"use client";

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
import { Plus, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from '@/lib/supabase';

export function EditClientDialog({ 
  client,
  onClientUpdated, 
  open: externalOpen, 
  onOpenChange: setExternalOpen,
  children
}: { 
  client: any;
  onClientUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;
  
  const [formData, setFormData] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    company: client?.company || '',
    email: client?.email || '',
    phone: client?.phone || '',
    city: client?.city || '',
    status: client?.status || 'Nuevo',
    summary: client?.summary || '',
    owner_id: client?.owner_id || ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        city: client.city || '',
        status: client.status || 'Nuevo',
        summary: client.summary || '',
        owner_id: client.owner_id || ''
      });
    }
  }, [client]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from('users').select('id, name').then(({ data }) => {
        if (data) setUsers(data);
      });
    }
  }, [open]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Update client
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          ...formData,
          owner_id: formData.owner_id || null
        })
        .eq('id', client.id);

      if (clientError) {
        if (clientError.code === '23505') { // Unique constraint violation
          if (clientError.message.includes('email')) throw new Error("El email ya está registrado por otro cliente.");
          if (clientError.message.includes('name')) throw new Error("El nombre y apellidos ya están registrados por otro cliente.");
          throw new Error("Error de duplicado en la base de datos.");
        }
        throw clientError;
      }
      
      setOpen(false);
      if (onClientUpdated) onClientUpdated();
    } catch (err: any) {
      console.error("Error updating client details (Full Object):", err);
      
      const errorMessage = err?.message || err?.details || "Error de red o de configuración";
      const errorDetails = err?.hint || err?.code || "";
      
      alert(`${errorMessage}\n${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const trigger = children || (
    <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-primary hover:bg-primary/10">
      <Edit2 size={14} />
    </Button>
  );

  const statusOptions = ['Nuevo', 'Contactado', 'Pendiente', 'Propuesta', 'Negociación', 'Cerrado', 'Perdido'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} nativeButton={true} />
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden border border-border shadow-2xl bg-card">
        <DialogHeader className="p-8 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-[22px] font-black tracking-tight text-foreground">Editar cliente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="bg-card">
          <div className="p-8 pt-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {/* Nombre y Apellidos */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre *</label>
                <Input 
                  name="first_name"
                  placeholder="Ana" 
                  required 
                  value={formData.first_name}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Apellidos</label>
                <Input 
                  name="last_name"
                  placeholder="García López" 
                  value={formData.last_name}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
            
            {/* Empresa y Ciudad */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Empresa *</label>
                <Input 
                  name="company"
                  placeholder="TechNova SL" 
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ciudad</label>
                <Input 
                  name="city"
                  placeholder="Madrid" 
                  value={formData.city}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                <Input 
                  name="email"
                  type="email" 
                  placeholder="ana@empresa.com" 
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Teléfono</label>
                <Input 
                  name="phone"
                  placeholder="+34 600 000 000" 
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[14px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Socio Asignado */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Socio Asignado</label>
              <Select 
                value={formData.owner_id} 
                onValueChange={(val: string | null) => { const v = val ?? ''; setFormData(prev => ({ ...prev, owner_id: v === 'none' ? '' : v })); }}
              >
                <SelectTrigger className="h-12 rounded-xl border-border bg-background focus:ring-1 focus:ring-primary font-bold text-[14px]">
                  <SelectValue placeholder="Selecciona un socio" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="none" className="focus:bg-primary/10 focus:text-primary">Sin asignar</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="focus:bg-primary/10 focus:text-primary">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Estado */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Estado</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: option }))}
                    className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all border ${
                      formData.status === option 
                        ? "bg-primary/20 border-primary text-primary shadow-sm" 
                        : "bg-background border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observaciones y detalles</label>
              <textarea 
                name="summary"
                placeholder="Notas sobre el cliente, historial, contexto de la relación comercial..." 
                value={formData.summary}
                onChange={handleChange}
                className="w-full min-h-[100px] rounded-2xl border border-border bg-background p-4 text-[13px] font-medium text-foreground transition-all placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

          </div>

          <DialogFooter className="p-8 pt-4 bg-muted/20 border-t border-border flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="h-12 px-8 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
