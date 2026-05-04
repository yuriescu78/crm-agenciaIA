"use client";

import { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  Target,
  Activity,
  Briefcase,
  Trophy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpportunities } from '@/hooks/useOpportunities';
import { NewOpportunityDialog } from "@/components/opportunities/NewOpportunityDialog";
import { cn } from '@/lib/utils';

import { 
  DndContext, 
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from '@/lib/supabase';

const columns = [
  "Nuevo lead",
  "Contactado",
  "Reunión agendada",
  "Diagnóstico",
  "Propuesta en preparación",
  "Propuesta enviada",
  "Negociación"
];

const columnIcons: Record<string, any> = {
  "Nuevo lead": TrendingUp,
  "Contactado": MoreVertical,
  "Reunión agendada": CalendarIcon,
  "Diagnóstico": TrendingUp,
  "Propuesta en preparación": TrendingUp,
  "Propuesta enviada": TrendingUp,
  "Negociación": TrendingUp,
};

const columnColors: Record<string, string> = {
  "Nuevo lead": "border-l-blue-500",
  "Contactado": "border-l-purple-500",
  "Reunión agendada": "border-l-amber-500",
  "Diagnóstico": "border-l-emerald-500",
  "Propuesta en preparación": "border-l-orange-500",
  "Propuesta enviada": "border-l-rose-500",
  "Negociación": "border-l-indigo-500",
};

function OppCard({ opp, columnColor, isDragging, isOverlay }: { opp: any, columnColor: string, isDragging?: boolean, isOverlay?: boolean }) {
  return (
    <Card 
      className={cn(
        "bg-card border-border transition-all duration-200 rounded-md overflow-hidden border-l-4 shadow-sm mb-3 select-none",
        columnColor,
        isDragging && !isOverlay ? "opacity-20 grayscale" : "opacity-100",
        isOverlay ? "shadow-2xl scale-105 cursor-grabbing border-primary ring-2 ring-primary/20" : "cursor-grab"
      )}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="text-[14px] font-bold text-foreground leading-tight truncate">
            {opp.title}
          </h4>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0",
            opp.probability >= 70 ? "bg-red-500/10 text-red-400" : 
            opp.probability >= 40 ? "bg-blue-500/10 text-blue-400" : 
            "bg-muted text-muted-foreground"
          )}>
            {opp.probability >= 70 ? 'Alta' : opp.probability >= 40 ? 'Media' : 'Baja'}
          </span>
        </div>
        
        <p className="text-[12px] font-medium text-muted-foreground mb-4">
          {opp.clients?.first_name} {opp.clients?.last_name}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <CalendarIcon size={12} className="opacity-50" />
            {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'S/F'}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
        </div>
      </CardContent>
    </Card>
  );
}

function SortableOppCard({ opp, columnColor }: { opp: any, columnColor: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: opp.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OppCard opp={opp} columnColor={columnColor} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({ 
  id, 
  title, 
  opps, 
  color, 
  icon: Icon, 
  loading, 
  onAdd 
}: { 
  id: string, 
  title: string, 
  opps: any[], 
  color: string, 
  icon: any, 
  loading: boolean, 
  onAdd: () => void 
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="w-[270px] sm:w-[300px] shrink-0 flex flex-col h-full group">
      {/* Column Header Card */}
      <div className={cn(
        "bg-card border border-border rounded-md p-3 sm:p-4 mb-3 sm:mb-4 shrink-0 transition-all duration-200",
        isOver && "border-primary shadow-lg shadow-primary/5 scale-[1.02]"
      )}>
         <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] font-bold text-foreground">{opps.length}</span>
            <Icon size={14} className={cn("transition-colors", isOver ? "text-primary" : "text-muted-foreground/50")} />
         </div>
         <p className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isOver ? "text-primary" : "text-muted-foreground")}>
          {title}
         </p>
      </div>

      {/* Column Section Label */}
      <div className="flex items-center gap-2 px-1 mb-3 sm:mb-4 shrink-0">
        <div className={cn("w-1.5 h-1.5 rounded-full bg-current", color.replace('border-l-', 'text-'))} />
        <h3 className="text-[10px] sm:text-[11px] font-bold text-foreground uppercase tracking-widest flex-1">{title}</h3>
        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm">{opps.length}</span>
      </div>
      
      {/* Cards Container */}
      <SortableContext 
        id={id}
        items={opps.map(o => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className={cn(
            "flex-1 overflow-y-auto space-y-1 pr-1.5 scrollbar-hide min-h-[150px] sm:min-h-[200px] rounded-md transition-colors duration-200",
            isOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
          )}
        >
          {loading && opps.length === 0 ? (
            <div className="p-6 sm:p-8 text-center bg-card/50 rounded-md border border-dashed border-border">
               <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
               <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Cargando...</p>
            </div>
          ) : opps.length === 0 ? (
            <div 
              className={cn(
                "py-8 sm:py-12 text-center rounded-md border border-dashed transition-all duration-200",
                isOver ? "bg-primary/10 border-primary shadow-inner" : "bg-card/30 border-border/50"
              )}
            >
               <p className={cn("text-[9px] sm:text-[10px] font-medium uppercase tracking-widest transition-colors", isOver ? "text-primary animate-pulse" : "text-muted-foreground/50")}>
                {isOver ? "Suelta aquí" : "Sin deals"}
               </p>
            </div>
          ) : (
            opps.map((opp) => (
              <SortableOppCard 
                key={opp.id} 
                opp={opp} 
                columnColor={color} 
              />
            ))
          )}
          
          <button 
            onClick={onAdd}
            className="w-full py-2 sm:py-2.5 mt-2 rounded-md border border-dashed border-border text-[10px] sm:text-[11px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Añadir
          </button>
        </div>
      </SortableContext>
    </div>
  );
}

export default function PipelinePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { opportunities, loading, refresh } = useOpportunities();
  const [localOpps, setLocalOpps] = useState<any[]>([]);
  const [activeOpp, setActiveOpp] = useState<any>(null);

  useEffect(() => {
    setLocalOpps(opportunities);
  }, [opportunities]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetectionStrategy = (args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const filteredOpportunities = localOpps.filter(o => 
    o.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.clients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const opp = localOpps.find(o => o.id === active.id);
    setActiveOpp(opp);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id as string;

    const activeOpp = localOpps.find(o => o.id === activeId);
    if (!activeOpp) return;

    // Determine the target stage
    let overStage: string | undefined;
    
    if (overId.startsWith('container-')) {
      overStage = overId.replace('container-', '');
    } else {
      const overOpp = localOpps.find(o => o.id === overId);
      if (overOpp) overStage = overOpp.stage;
    }

    if (overStage && activeOpp.stage !== overStage) {
      console.log(`Moviendo ${activeOpp.title} a ${overStage}`);
      setLocalOpps(prev => {
        const activeIndex = prev.findIndex(o => o.id === activeId);
        if (activeIndex === -1) return prev;
        
        const newOpps = [...prev];
        newOpps[activeIndex] = { ...newOpps[activeIndex], stage: overStage };
        return newOpps;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpp(null);

    if (!over) return;

    const oppId = active.id as string;
    const overId = over.id as string;

    let targetStage: string | undefined;
    
    if (overId.startsWith('container-')) {
      targetStage = overId.replace('container-', '');
    } else {
      const overOpp = localOpps.find(o => o.id === overId);
      if (overOpp) targetStage = overOpp.stage;
    }

    if (targetStage) {
      console.log(`Finalizando movimiento a ${targetStage}`);
      const { error } = await supabase
        .from('opportunities')
        .update({ stage: targetStage })
        .eq('id', oppId);

      if (error) {
        console.error("Error updating stage:", error);
        alert("Error al actualizar la etapa");
        refresh(); // Rollback on error
      }
    }
  };

  const totalValue = filteredOpportunities.reduce((acc, curr) => acc + (curr.estimated_value || 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Pipeline de Gestión</h1>
          <p className="text-[12px] sm:text-sm text-muted-foreground mt-1">
            {filteredOpportunities.length} leads activos
          </p>
        </div>
        <NewOpportunityDialog onOpportunityCreated={refresh}>
          <Button className="bg-primary text-primary-foreground hover:brightness-110 font-bold px-4 sm:px-6 rounded-md h-10 text-sm sm:text-base">
            + Nuevo lead
          </Button>
        </NewOpportunityDialog>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveOpp(null)}
      >
        <div className="flex-1 overflow-x-auto board-scroll -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-8">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => {
              const columnOpps = filteredOpportunities.filter(o => o.stage === column);
              const ColumnIcon = columnIcons[column] || TrendingUp;
              
              return (
                <DroppableColumn 
                  key={column}
                  id={`container-${column}`}
                  title={column}
                  opps={columnOpps}
                  color={columnColors[column]}
                  icon={ColumnIcon}
                  loading={loading}
                  onAdd={() => {/* handled by top-level dialog */}}
                />
              );
            })}
            {/* Spacer to avoid cutting off last column */}
            <div className="w-4 shrink-0" />
          </div>
        </div>

        <DragOverlay 
          className="pointer-events-none"
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.3',
                },
              },
            }),
          }}
        >
          {activeOpp ? (
            <OppCard 
              opp={activeOpp} 
              columnColor={columnColors[activeOpp.stage]} 
              isOverlay 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
