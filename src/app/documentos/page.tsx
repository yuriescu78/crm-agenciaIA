"use client";

import { useState } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  RefreshCw, 
  Folder, 
  Download, 
  MoreVertical,
  Cloud,
  File,
  Table,
  Plus,
  Filter,
  Users,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

export default function DocumentosPage() {
  const [activeClient, setActiveClient] = useState('TechNova SL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const clients = [
    { name: 'TechNova SL', docs: 4, initials: 'TN', color: 'bg-blue-500' },
    { name: 'Grupo Impulso', docs: 0, initials: 'GI', color: 'bg-orange-500' },
    { name: 'Innova Digital', docs: 7, initials: 'ID', color: 'bg-emerald-500' },
    { name: 'DataFlow Corp', docs: 0, initials: 'DF', color: 'bg-sky-500' },
    { name: 'Pixel Studio', docs: 5, initials: 'PS', color: 'bg-purple-500' },
    { name: 'CloudBase Inc', docs: 0, initials: 'CB', color: 'bg-blue-400' },
  ];

  const allDocuments = [
    { name: 'Contrato Marco 2026.pdf', type: 'PDF', size: '2.4 MB', date: '20 Abr 2026', icon: <FileText className="text-red-500" /> },
    { name: 'Propuesta Técnica v2.docx', type: 'Word', size: '845 KB', date: '18 Abr 2026', icon: <File className="text-blue-500" /> },
    { name: 'Reunión Kickoff — Notas.gdoc', type: 'Google Doc', size: '—', date: '15 Abr 2026', icon: <FileText className="text-blue-400" /> },
    { name: 'Presupuesto Detallado.xlsx', type: 'Google Sheet', size: '1.1 MB', date: '10 Abr 2026', icon: <Table className="text-emerald-500" /> },
  ];

  const filteredDocuments = allDocuments.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* Top Status Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#141415] border border-border/50 p-6 rounded-[28px]">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Cloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Google Drive Conectado</span>
            </div>
            <p className="text-[13px] text-muted-foreground font-medium">Sincronización en tiempo real activa</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-xl font-bold border-border bg-white/5 hover:bg-white/10">
            Desconectar Drive
          </Button>
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 md:flex-none h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6 transition-all"
          >
            <RefreshCw size={18} className={cn("mr-2", isSyncing && "animate-spin")} /> 
            {isSyncing ? "Sincronizando..." : "Sync Drive"}
          </Button>
        </div>
      </div>

      {/* Main Controls Area */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Client Selector */}
          <div className="lg:col-span-4">
            <Select value={activeClient} onValueChange={(v) => { if (v !== null) setActiveClient(v); }}>
              <SelectTrigger className="h-14 rounded-2xl bg-[#141415] border-border/50 px-6 text-[14px] font-bold text-foreground focus:ring-1 focus:ring-primary">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-primary" />
                  <SelectValue placeholder="Seleccionar Cliente" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1b] border-border text-foreground rounded-2xl">
                {clients.map(client => (
                  <SelectItem key={client.name} value={client.name} className="focus:bg-primary/10 focus:text-primary py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white", client.color)}>
                        {client.initials}
                      </div>
                      {client.name}
                      <span className="ml-auto text-[10px] opacity-40">{client.docs} docs</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Bar */}
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={20} />
            <Input 
              placeholder="Buscar por nombre, tipo o fecha..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-14 rounded-2xl bg-[#141415] border-border/50 text-[15px] font-medium focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Upload Button */}
          <div className="lg:col-span-2">
            <Button className="w-full h-14 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110">
              <Upload size={20} className="mr-2" /> Subir
            </Button>
          </div>
        </div>

        {/* Drag & Drop Area - Subtle */}
        <div className="h-20 border border-dashed border-border/50 rounded-2xl flex items-center justify-center gap-3 text-muted-foreground/40 group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
          <Plus size={20} className="group-hover:text-primary transition-colors" />
          <span className="text-sm font-bold group-hover:text-primary transition-colors uppercase tracking-widest text-[11px]">Arrastra archivos para subir a {activeClient}</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <Folder className="text-primary" size={22} />
            Documentos de {activeClient}
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {searchQuery 
              ? `Encontrados ${filteredDocuments.length} resultados` 
              : `Mostrando ${filteredDocuments.length} archivos sincronizados`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#141415] p-1.5 rounded-xl border border-border/50">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}
           >
              <LayoutGrid size={18} />
           </Button>
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode('list')}
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              viewMode === 'list' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
            )}
           >
              <List size={18} />
           </Button>
        </div>
      </div>

      {/* Content Rendering */}
      {filteredDocuments.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
            <Search size={32} />
          </div>
          <p className="text-muted-foreground font-medium">No se encontraron documentos que coincidan con tu búsqueda.</p>
          <Button variant="ghost" onClick={() => setSearchQuery('')} className="text-primary font-bold">Limpiar búsqueda</Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredDocuments.map((doc, i) => (
             <Card key={i} className="group bg-[#141415] border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all rounded-[28px] overflow-hidden">
                <CardContent className="p-7">
                   <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                         {doc.icon}
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[9px] uppercase tracking-widest px-2">
                         Drive
                      </Badge>
                   </div>
                   
                   <div className="space-y-1 mb-8">
                      <h3 className="text-[15px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{doc.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] text-muted-foreground font-medium">
                           {doc.type} • {doc.size}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.15em] mt-3">
                         Sincronizado: {doc.date}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl font-bold h-11 text-[12px] border-border bg-white/[0.02] hover:bg-white/[0.05] group-hover:border-primary/20">
                         Ver
                      </Button>
                      <Button variant="outline" className="rounded-xl font-bold h-11 text-[12px] bg-primary/5 border-primary/10 text-primary hover:bg-primary/10 group-hover:border-primary/30">
                         <Download size={14} className="mr-2" /> Descargar
                      </Button>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-[#141415] border border-border/50 rounded-[28px] overflow-hidden">
           <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/50 bg-white/[0.01]">
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Nombre</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tamaño</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Fecha</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDocuments.map((doc, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-xl">
                          {doc.icon}
                        </div>
                        <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10 font-bold text-[10px]">
                        {doc.type}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-[13px] text-muted-foreground font-medium">{doc.size}</td>
                    <td className="px-8 py-5 text-[13px] text-muted-foreground font-medium">{doc.date}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Download size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white/5 text-muted-foreground">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
