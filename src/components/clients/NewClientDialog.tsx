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
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from '@/lib/supabase';

export function NewClientDialog({ 
  onClientCreated, 
  open: externalOpen, 
  onOpenChange: setExternalOpen,
  hideTrigger = false,
  children
}: { 
  onClientCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  children?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    email: '',
    phone: '',
    city: '',
    status: 'Nuevo',
    summary: '',
    owner_id: ''
  });
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from('users').select('id, name').then(({ data }) => {
        if (data) setUsers(data);
      });
    }
  }, [open]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [newTask, setNewTask] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks(prev => [...prev, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Pre-validation: Check if client with same name or email exists
      const { data: existingClient, error: searchError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .or(`email.eq.${formData.email},and(first_name.eq.${formData.first_name},last_name.eq.${formData.last_name})`)
        .maybeSingle();

      if (searchError) console.error("Search error:", searchError);
      
      if (existingClient) {
        if (existingClient.email === formData.email && formData.email) {
          throw new Error(`Ya existe un cliente registrado con el email: ${formData.email}`);
        }
        if (existingClient.first_name === formData.first_name && existingClient.last_name === formData.last_name) {
          throw new Error(`Ya existe un cliente registrado con el nombre: ${formData.first_name} ${formData.last_name}`);
        }
      }

      // 2. Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert([{
          ...formData,
          owner_id: formData.owner_id || null
        }])
        .select()
        .single();

      if (clientError) {
        if (clientError.code === '23505') { // Unique constraint violation
          if (clientError.message.includes('email')) throw new Error("El email ya está registrado.");
          if (clientError.message.includes('name')) throw new Error("El nombre y apellidos ya están registrados.");
          throw new Error("Este cliente ya existe en la base de datos.");
        }
        throw clientError;
      }

      // 3. Create tasks if any
      if (tasks.length > 0 && client) {
        const tasksToInsert = tasks.map(taskTitle => ({
          client_id: client.id,
          title: taskTitle,
          status: 'Pendiente',
          priority: 'Media'
        }));
        
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);
          
        if (tasksError) console.error("Error creating linked tasks:", tasksError);
      }
      
      setOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        company: '',
        email: '',
        phone: '',
        city: '',
        status: 'Nuevo',
        summary: '',
        owner_id: ''
      });
      setTasks([]);
      if (onClientCreated) onClientCreated();
    } catch (err: any) {
      console.error("Error creating client details (Full Object):", err);
      
      const errorMessage = err?.message || err?.details || "Error de red o de configuración";
      const errorDetails = err?.hint || err?.code || "";
      
      alert(`${errorMessage}\n${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const trigger = children || (
    <Button>
      <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
    </Button>
  );

  const statusOptions = ['Nuevo', 'Contactado', 'Pendiente', 'Propuesta', 'Negociación', 'Cerrado', 'Perdido'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && <DialogTrigger render={trigger as React.ReactElement} nativeButton={!children} />}
      <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden border border-border shadow-2xl bg-card">
        <DialogHeader className="p-8 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-[22px] font-black tracking-tight text-foreground">Nuevo cliente</DialogTitle>
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

            {/* Tareas Vinculadas */}
            <div className="space-y-3 pt-2 border-t border-border">
              <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tareas vinculadas</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Añadir tarea..." 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTask())}
                  className="h-11 rounded-xl border-border bg-background focus:bg-background transition-all font-bold text-[13px] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button 
                  type="button" 
                  onClick={addTask}
                  className="h-11 px-6 font-black rounded-xl bg-primary text-primary-foreground hover:brightness-110"
                >
                  + Añadir
                </Button>
              </div>
              {tasks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tasks.map((task, i) => (
                    <div key={i} className="px-3 py-1.5 bg-muted rounded-lg text-[12px] font-bold text-foreground flex items-center gap-2 border border-border">
                      {task}
                      <button type="button" onClick={() => setTasks(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-8 pt-4 bg-muted/20 border-t border-border flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="h-12 px-8 rounded-xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="h-12 px-8 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110">
              {loading ? 'Creando...' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
