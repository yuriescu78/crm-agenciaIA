"use client";

import { useState } from 'react';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';

interface NewNoteDialogProps {
  clientId: string;
  onNoteCreated?: () => void;
  children?: React.ReactNode;
}

export function NewNoteDialog({ clientId, onNoteCreated, children }: NewNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('client_notes')
        .insert([
          {
            client_id: clientId,
            content: content.trim(),
            author_name: 'Equipo Nexus' // Default author for now
          }
        ]);

      if (error) throw error;

      setContent('');
      setOpen(false);
      if (onNoteCreated) onNoteCreated();
    } catch (err: any) {
      console.error("Error creating note:", err);
      alert("Error al crear la nota: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const trigger = children || (
    <Button variant="ghost" size="sm" className="text-primary font-bold text-[11px] uppercase tracking-widest hover:bg-primary/10 transition-all">
      Nueva Nota
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} nativeButton={!children} />
      <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="text-primary" size={20} />
            Añadir Nota del Equipo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Contenido de la nota
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí los detalles importantes sobre este cliente..."
              className="w-full h-32 bg-white/[0.03] border border-white/5 rounded-xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="font-bold text-[13px]"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !content.trim()}
              className="bg-primary hover:brightness-110 text-white font-bold px-8 shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus size={16} className="mr-2" />}
              Guardar Nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
