"use client";

import { use, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Globe, 
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Briefcase,
  CheckSquare,
  StickyNote,
  Home as HomeIcon,
  MapPin,
  Building2,
  ExternalLink,
  MessageSquare,
  Plus,
  Activity,
  ChevronRight,
  Zap,
  Target,
  Trophy,
  Users,
  Trash2,
  CheckCircle2,
  MoreVertical,
  Split,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NewOpportunityDialog } from '@/components/opportunities/NewOpportunityDialog';
import { NewNoteDialog } from '@/components/clients/NewNoteDialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import { supabase } from '@/lib/supabase';

const PIPELINE_STAGES = [
  "Nuevo lead",
  "Contactado",
  "Reunión agendada",
  "Diagnóstico",
  "Propuesta en preparación",
  "Propuesta enviada",
  "Negociación"
];

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [client, setClient] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingOpps, setLoadingOpps] = useState(true);
  
  const fetchClientData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
      
      if (data && data.owner_id) {
        const { data: ownerData } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.owner_id)
          .single();
        if (ownerData) {
          data.users = { name: ownerData.name };
        }
      }
      
      setClient(data);
    } catch (err) {
      console.error("Error fetching client:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoadingOpps(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('client_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoadingOpps(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  useEffect(() => {
    fetchClientData();
    fetchNotes();
    fetchTasks();
    fetchOpportunities();
  }, [resolvedParams.id]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'completada') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'en curso') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'revisión') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'pendiente') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return 'bg-muted text-muted-foreground';
  };

  const currentOpportunity = opportunities[0]; // Get most recent
  const currentStageIndex = currentOpportunity ? PIPELINE_STAGES.indexOf(currentOpportunity.stage) : -1;

  const activityTimeline = [
    ...tasks.map(t => ({ id: `t-${t.id}`, type: 'task', title: `Trabajo asignado: ${t.title}`, desc: `Prioridad ${t.priority}`, date: t.created_at, icon: Briefcase, color: 'text-blue-400 bg-blue-500/10' })),
    ...opportunities.map(o => ({ id: `o-${o.id}`, type: 'opportunity', title: `Nuevo lead: ${o.title}`, desc: `Valor: ${o.estimated_value?.toLocaleString() || 0} €`, date: o.created_at, icon: Target, color: 'text-emerald-400 bg-emerald-500/10' })),
    ...notes.map(n => ({ id: `n-${n.id}`, type: 'note', title: `Nota de ${n.author_name || 'Equipo ELITOR.IA'}`, desc: n.content, date: n.created_at, icon: MessageSquare, color: 'text-amber-400 bg-amber-500/10' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-1000 pb-20 px-4">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-card border border-border hover:bg-muted transition-all">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
              <span>Clientes</span>
              <ChevronRight size={10} />
              <span className="text-foreground">{client.first_name} {client.last_name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.first_name} {client.last_name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-md font-bold text-[13px]">
            Editar Perfil
          </Button>
          <NewOpportunityDialog onOpportunityCreated={fetchOpportunities}>
            <button className="inline-flex items-center justify-center h-10 px-5 font-bold text-[13px] bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-primary/20">
              <Plus size={16} className="mr-2" /> Nueva Oportunidad
            </button>
          </NewOpportunityDialog>
        </div>
      </div>

      {/* Profile Header Banner */}
      <Card className="bg-[#141415] border-border/50 shadow-2xl rounded-2xl overflow-hidden mb-10">
        <CardContent className="p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 flex-1">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {client.first_name.charAt(0)}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-bold tracking-tight text-white">{client.first_name} {client.last_name}</h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20 py-0.5 px-3 font-bold text-[11px] uppercase tracking-wider">
                    {client.status}
                  </Badge>
                </div>
                <p className="text-[15px] font-bold text-muted-foreground mb-6">{client.company} • {client.position}</p>
                <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                    <Mail size={14} className="text-primary" /> {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                    <Phone size={14} className="text-primary" /> {client.phone}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-64 p-6 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Socio Asignado</span>
              <p className="text-[15px] font-bold text-white tracking-tight">{client.users?.name || 'Sin asignar'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs & Content */}
      <Tabs defaultValue="resumen" className="w-full flex flex-col">
        <div className="w-full border-b border-white/5 mb-10">
          <TabsList className="bg-transparent p-0 gap-10 h-12 w-full justify-start overflow-x-auto scrollbar-hide">
            <TabsTrigger value="resumen" className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-4 font-bold text-[14px] uppercase tracking-[0.1em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all">Resumen</TabsTrigger>
            <TabsTrigger value="actividad" className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-4 font-bold text-[14px] uppercase tracking-[0.1em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all">Actividad</TabsTrigger>
            <TabsTrigger value="oportunidades" className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-4 font-bold text-[14px] uppercase tracking-[0.1em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all">Oportunidades</TabsTrigger>
            <TabsTrigger value="tareas" className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-4 font-bold text-[14px] uppercase tracking-[0.1em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all">Tareas</TabsTrigger>
            <TabsTrigger value="documentos" className="bg-transparent rounded-none border-b-2 border-transparent px-0 pb-4 font-bold text-[14px] uppercase tracking-[0.1em] text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary transition-all">Documentos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="w-full m-0 animate-in fade-in duration-500">
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-[#141415] border-border/50 rounded-2xl overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                        <MessageSquare size={18} />
                     </div>
                     <CardTitle className="text-lg font-bold">Notas del Equipo</CardTitle>
                  </div>
                  <NewNoteDialog clientId={client.id} onNoteCreated={fetchNotes} />
                </CardHeader>
                <CardContent className="p-8">
                   <div className="space-y-6">
                      {loadingNotes ? (
                        <div className="text-center py-10 opacity-50">Cargando notas...</div>
                      ) : notes.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                          <p className="text-sm text-muted-foreground">No hay notas registradas para este cliente.</p>
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div key={note.id} className="group relative flex gap-5 p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex-shrink-0 flex items-center justify-center font-bold text-primary text-xs">
                              {note.author_name?.split(' ').map((n: string) => n[0]).join('') || 'NX'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[13px] font-bold text-foreground">{note.author_name || 'Equipo ELITOR.IA'}</h4>
                                <div className="flex items-center gap-4">
                                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-wide">{formatDate(note.created_at)}</span>
                                  <button 
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[13px] text-muted-foreground font-medium leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                </CardContent>
              </Card>

              <div className="space-y-8">
                {/* Pipeline Status Widget */}
                <Card className="bg-[#141415] border-border/50 rounded-2xl overflow-hidden shadow-xl">
                   <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Split size={16} className="text-primary" />
                          <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Estado Pipeline</h4>
                        </div>
                        {currentOpportunity && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase">
                            {currentOpportunity.probability}% Prob.
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[16px] font-bold text-white">
                          {currentOpportunity ? currentOpportunity.stage : "Sin Oportunidades"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {currentOpportunity ? currentOpportunity.title : "Crea una para ver el progreso"}
                        </p>
                      </div>
                   </div>

                   <div className="p-6 space-y-4">
                      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                         {PIPELINE_STAGES.map((stage, i) => {
                           const isCompleted = i < currentStageIndex;
                           const isCurrent = i === currentStageIndex;
                           return (
                             <div key={stage} className={cn(
                               "flex items-center gap-3 p-2 rounded-lg transition-all",
                               isCurrent ? "bg-primary/5 ring-1 ring-primary/20" : ""
                             )}>
                                <div className={cn(
                                  "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border transition-all",
                                  isCompleted ? "bg-primary border-primary text-white" : 
                                  isCurrent ? "bg-primary/20 border-primary text-primary" : 
                                  "bg-white/5 border-white/10 text-muted-foreground/30"
                                )}>
                                  {isCompleted ? <CheckCircle2 size={10} /> : i + 1}
                                </div>
                                <span className={cn(
                                  "text-[11px] font-bold tracking-tight transition-colors",
                                  isCurrent ? "text-primary" : 
                                  isCompleted ? "text-white/80" : 
                                  "text-muted-foreground/40"
                                )}>
                                  {stage}
                                </span>
                             </div>
                           );
                         })}
                      </div>

                      <Button variant="ghost" className="w-full mt-2 h-9 rounded-xl border border-white/5 hover:bg-white/5 text-[11px] font-bold text-muted-foreground">
                        Ver en Pipeline <ChevronDown size={14} className="ml-1 -rotate-90" />
                      </Button>
                   </div>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 rounded-2xl bg-[#141415] border border-border/50 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Tareas</p>
                      <p className="text-xl font-bold text-white">{tasks.length}</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-[#141415] border border-border/50 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Oportunidades</p>
                      <p className="text-xl font-bold text-white">{opportunities.length}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tareas" className="w-full m-0 animate-in fade-in duration-500">
          <Card className="bg-[#141415] border-border/50 rounded-[28px] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Trabajos Pendientes</CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Gestión de tareas específicas para este cliente</CardDescription>
              </div>
              <NewTaskDialog onTaskCreated={fetchTasks}>
                <button className="inline-flex items-center justify-center h-10 px-5 font-bold text-[12px] bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-primary/20 uppercase tracking-widest">
                  + Nuevo Trabajo
                </button>
              </NewTaskDialog>
            </CardHeader>
            <CardContent className="p-0">
               {loadingTasks ? (
                 <div className="p-20 text-center">
                   <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando tareas...</p>
                 </div>
               ) : tasks.length === 0 ? (
                 <div className="p-24 text-center">
                    <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">¡Sin tareas pendientes!</h3>
                    <p className="text-muted-foreground text-sm mt-1">Este cliente está al día. No hay trabajos asignados actualmente.</p>
                 </div>
               ) : (
                 <div className="divide-y divide-white/5">
                   {tasks.map((task) => (
                     <div key={task.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn("w-1.5 h-10 rounded-full", task.priority === 'Alta' ? 'bg-red-500' : task.priority === 'Media' ? 'bg-amber-500' : 'bg-blue-500')} />
                           <div>
                              <h4 className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                 <Badge className={cn("text-[9px] font-black uppercase tracking-tighter", getStatusColor(task.status))}>
                                   {task.status}
                                 </Badge>
                                 <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                    <CalendarIcon size={12} className="opacity-40" />
                                    {new Date(task.due_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right hidden sm:block">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Progreso</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${task.progress || 0}%` }} />
                                 </div>
                                 <span className="text-[12px] font-black text-foreground">{task.progress || 0}%</span>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                              <MoreVertical size={18} />
                           </Button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="w-full m-0 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="bg-[#141415] border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-[16px] font-bold text-white">{opp.title}</h4>
                  <Badge className="bg-primary/10 text-primary border-primary/20">{opp.stage}</Badge>
                </div>
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Planificación</p>
                    <p className="text-[13px] font-bold text-white">Seguimiento Activo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cierre</p>
                    <p className="text-[13px] font-bold text-white">{formatDate(opp.expected_close_date)}</p>
                  </div>
                </div>
              </Card>
            ))}
            {opportunities.length === 0 && (
              <Card className="col-span-full bg-[#141415] border-border/50 rounded-2xl p-24 text-center">
                <h3 className="text-xl font-bold text-foreground mb-4">No hay oportunidades activas</h3>
                <NewOpportunityDialog onOpportunityCreated={fetchOpportunities}>
                  <Button className="bg-primary hover:brightness-110 text-white rounded-lg px-8 h-10 font-bold">Crear Oportunidad</Button>
                </NewOpportunityDialog>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="actividad" className="w-full m-0 animate-in fade-in duration-500">
          <Card className="bg-[#141415] border-border/50 rounded-[28px] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-bold">Línea de Tiempo</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">Registro automático de todos los movimientos con este cliente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               {activityTimeline.length === 0 ? (
                 <div className="p-24 text-center">
                    <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
                      <Activity size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Sin actividad reciente</h3>
                    <p className="text-muted-foreground text-sm mt-1">Todavía no hay movimientos registrados para este cliente.</p>
                 </div>
               ) : (
                 <div className="p-8 relative">
                   <div className="absolute left-[51px] top-8 bottom-8 w-px bg-white/5" />
                   <div className="space-y-8 relative z-10">
                     {activityTimeline.map((item) => {
                       const Icon = item.icon;
                       return (
                         <div key={item.id} className="flex gap-6 relative group">
                            <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center relative border border-white/5 shadow-xl transition-transform group-hover:scale-110", item.color)}>
                               <Icon size={16} />
                            </div>
                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.04] transition-all">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                 <h4 className="text-[14px] font-bold text-foreground">{item.title}</h4>
                                 <span className="text-[11px] font-bold text-white/40 uppercase tracking-wide whitespace-nowrap">{formatDate(item.date)}</span>
                               </div>
                               {item.desc && (
                                 <p className="text-[13px] text-muted-foreground font-medium leading-relaxed line-clamp-2">{item.desc}</p>
                               )}
                            </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="w-full m-0">
          <Card className="bg-[#141415] border-border/50 rounded-2xl p-24 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Repositorio de Archivos</h3>
            <p className="text-muted-foreground text-sm">No se han subido documentos todavía.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
