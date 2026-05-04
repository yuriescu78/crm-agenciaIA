"use client";

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon,
  User,
  Filter,
  MoreHorizontal,
  LayoutDashboard,
  CheckCircle,
  Briefcase,
  ListTodo,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { useTasks } from '@/hooks/useTasks';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  'Baja': 'bg-neutral-100 text-neutral-500 border-neutral-200',
  'Media': 'bg-primary-100 text-primary-600 border-primary-200',
  'Alta': 'bg-amber-100 text-amber-600 border-amber-200',
  'Urgente': 'bg-red-100 text-red-600 border-red-200',
};

export default function TareasPage() {
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { tasks, loading, refresh } = useTasks();

  const stats = {
    total: tasks.length,
    enCurso: tasks.filter(t => t.status === 'En curso').length,
    completados: tasks.filter(t => t.status === 'Completada').length,
    pendientes: tasks.filter(t => t.status === 'Pendiente').length
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.clients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'Todos') return true;
    return t.status === activeTab;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'S/F';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("¿Estás seguro de que deseas eliminar este trabajo?")) return;

    try {
      const { error, count } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await refresh();
      alert("Trabajo eliminado correctamente");
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar el trabajo: " + (err.message || "Error desconocido"));
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completada') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'en curso') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'revisión') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'pendiente') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return 'bg-muted text-muted-foreground';
  };

  const getProgressColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completada') return 'bg-emerald-500';
    if (s === 'en curso') return 'bg-blue-500';
    if (s === 'revisión') return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 px-1 sm:px-0">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trabajos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.enCurso} en curso · {stats.completados} completados
          </p>
        </div>
        <NewTaskDialog onTaskCreated={refresh}>
          <div className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:brightness-110 font-bold px-6 h-10 rounded-md shadow-lg shadow-primary/20 cursor-pointer transition-all active:scale-[0.98]">
            + Nuevo trabajo
          </div>
        </NewTaskDialog>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'border-t-primary' },
          { label: 'En curso', value: stats.enCurso, color: 'border-t-blue-500' },
          { label: 'Completados', value: stats.completados, color: 'border-t-emerald-500' },
          { label: 'Pendientes', value: stats.pendientes, color: 'border-t-amber-500' },
        ].map((stat, i) => (
          <Card key={i} className={cn("bg-card border-border border-t-4 rounded-md shadow-sm", stat.color)}>
            <CardContent className="p-5">
              <h4 className="text-[28px] font-bold text-foreground mb-1 leading-none">{stat.value}</h4>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row gap-6 mb-8 items-start xl:items-center justify-between">
        <div className="bg-card/50 p-1 rounded-md border border-border flex flex-wrap gap-1 max-w-full overflow-x-auto board-scroll">
          {['Todos', 'En curso', 'Revisión', 'Pendiente', 'Completada'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-1.5 rounded-sm text-[11px] font-bold transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab === 'Completada' ? 'Completado' : tab}
            </button>
          ))}
        </div>

        <div className="relative group w-full xl:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            placeholder="Buscar trabajos..." 
            className="w-full pl-11 pr-4 h-10 bg-card border border-border rounded-md text-[13px] font-medium outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-20 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sincronizando...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
          {filteredTasks.map((task, i) => (
            <NewTaskDialog key={task.id} task={task} onTaskCreated={refresh}>
              <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group rounded-md shadow-sm overflow-hidden flex flex-col cursor-pointer active:scale-[0.98]">
                <CardContent className="p-6 flex-1 flex flex-col relative">
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => handleDelete(task.id, e)}
                    className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex justify-between items-start mb-4 pr-8">
                    <span className="text-[10px] font-bold text-muted-foreground/40 tracking-wider">TRB-{i+101}</span>
                    <Badge className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border", getStatusColor(task.status))}>
                      {task.status?.toLowerCase() === 'completada' ? 'Completado' : task.status}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-[15px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors mb-1 line-clamp-1">
                      {task.title}
                    </h4>
                    <p className="text-[12px] font-medium text-muted-foreground line-clamp-1">
                      {task.clients?.company || `${task.clients?.first_name} ${task.clients?.last_name || ''}`}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progreso</span>
                        <span className="text-[11px] font-black text-foreground">{(task as any).progress || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500 rounded-full", getProgressColor(task.status))} 
                          style={{ width: `${(task as any).progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary/20 to-primary/40 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                          {task.clients?.first_name?.charAt(0) || 'A'}
                        </div>
                        <span className="text-[13px] font-bold text-foreground">
                          {((task as any).estimated_value || 0).toLocaleString()} €
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <CalendarIcon size={12} className="opacity-40" />
                        {formatDate(task.due_date)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </NewTaskDialog>
          ))}
        </div>
      ) : (
        <div className="p-24 text-center bg-card/30 rounded-md border border-dashed border-border flex flex-col items-center">
          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center mb-6 border border-border">
             <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground">¡Todo en orden!</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">No hay trabajos que coincidan con tu búsqueda actual.</p>
        </div>
      )}
    </div>
  );
}
