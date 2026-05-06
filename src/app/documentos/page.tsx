"use client";

import { useState, useEffect, useRef } from 'react';
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
  Users,
  LayoutGrid,
  List,
  Eye,
  Trash2
} from 'lucide-react';
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useClients } from '@/hooks/useClients';
import { useDocuments } from '@/hooks/useDocuments';
import { toast } from 'sonner';

export default function DocumentosPage() {
  const { clients } = useClients();
  const [activeClientId, setActiveClientId] = useState<string>('');
  const { documents, loading: loadingDocs, syncing, sync, uploading, upload, deleting, remove, isConnected } = useDocuments(activeClientId || null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first client if none selected
  useEffect(() => {
    if (clients.length > 0 && !activeClientId) {
      setActiveClientId(clients[0].id);
    }
  }, [clients, activeClientId]);

  const activeClient = clients.find(c => c.id === activeClientId);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.type && doc.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSync = async () => {
    if (!activeClientId) return;
    const result = await sync();
    if (result?.success) {
      toast.success(`Sincronizados ${result.count} archivos correctamente`);
    } else {
      toast.error('Error al sincronizar: ' + result?.error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeClientId) return;
    
    const file = files[0];
    const result = await upload(file);
    
    if (result?.success) {
      toast.success(`Archivo "${file.name}" subido a Google Drive`);
    } else {
      toast.error('Error al subir: ' + result?.error);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el registro de "${name}"? (No se borrará el archivo de Google Drive)`)) return;
    
    const result = await remove(id);
    if (result.success) {
      toast.success('Registro eliminado correctamente');
    } else {
      toast.error('Error al eliminar: ' + result.error);
    }
  };

  const getFileIcon = (type?: string) => {

    const t = (type || '').toLowerCase();
    if (t.includes('pdf')) return <FileText className="text-red-500" />;
    if (t.includes('doc')) return <File className="text-blue-500" />;
    if (t.includes('sheet') || t.includes('xls') || t.includes('xlsx')) return <Table className="text-emerald-500" />;
    return <FileText className="text-blue-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* Top Status Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#141415] border border-border/50 p-6 rounded-[28px]">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl",
            isConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            <Cloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isConnected ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className={cn(
                "text-[11px] font-bold uppercase tracking-widest",
                isConnected ? "text-emerald-500" : "text-red-500"
              )}>
                {isConnected ? "Google Drive Conectado" : "Google Drive Desconectado"}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground font-medium">
              {isConnected ? "Sincronización en tiempo real activa" : "Requiere vinculación de cuenta"}
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/auth/google'}
            className="flex-1 md:flex-none h-11 rounded-xl font-bold border-border bg-white/5 hover:bg-white/10"
          >
            Configurar Drive
          </Button>
          <Button 
            onClick={handleSync}
            disabled={syncing || !activeClientId}
            className="flex-1 md:flex-none h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6 transition-all"
          >
            <RefreshCw size={18} className={cn("mr-2", syncing && "animate-spin")} /> 
            {syncing ? "Sincronizando..." : "Sync Drive"}
          </Button>
        </div>
      </div>

      {/* Main Controls Area */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Client Selector */}
          <div className="lg:col-span-4">
            <Select value={activeClientId} onValueChange={setActiveClientId}>
              <SelectTrigger className="h-14 rounded-2xl bg-[#141415] border-border/50 px-6 text-[14px] font-bold text-foreground focus:ring-1 focus:ring-primary">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-primary" />
                  <SelectValue placeholder="Seleccionar Cliente">
                    {activeClient ? `${activeClient.first_name} ${activeClient.last_name || ''}` : 'Seleccionar Cliente'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1b] border-border text-foreground rounded-2xl">
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id} className="focus:bg-primary/10 focus:text-primary py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white bg-primary")}>
                        {(client.first_name?.[0] || '') + (client.last_name?.[0] || '')}
                      </div>
                      {client.first_name} {client.last_name}
                      {client.company && <span className="ml-2 text-[10px] opacity-40">({client.company})</span>}
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
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => handleFileUpload(e.target.files)} 
            />
            <Button 
              disabled={uploading || !activeClientId}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-14 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110"
            >
              {uploading ? <RefreshCw size={20} className="mr-2 animate-spin" /> : <Upload size={20} className="mr-2" />} 
              {uploading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
        </div>

        {/* Drag & Drop Area - Subtle */}
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "h-20 border border-dashed border-border/50 rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer group",
            uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          {uploading ? (
            <RefreshCw size={20} className="text-primary animate-spin" />
          ) : (
            <Plus size={20} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
          )}
          <span className="text-sm font-bold group-hover:text-primary transition-colors uppercase tracking-widest text-[11px] text-muted-foreground/40">
            {uploading ? "Subiendo archivo a Google Drive..." : `Arrastra archivos para subir a ${activeClient ? `${activeClient.first_name} ${activeClient.last_name || ''}` : 'cliente'}`}
          </span>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <Folder className="text-primary" size={22} />
            Documentos de {activeClient ? `${activeClient.first_name} ${activeClient.last_name || ''}` : '...'}
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
      {loadingDocs ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary opacity-50" />
          <p className="mt-4 text-muted-foreground animate-pulse">Cargando documentos...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
            <Search size={32} />
          </div>
          <p className="text-muted-foreground font-medium">No se encontraron documentos en Google Drive.</p>
          <Button variant="ghost" onClick={() => handleSync()} className="text-primary font-bold">Sincronizar ahora</Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredDocuments.map((doc) => (
             <Card key={doc.id} className="group bg-[#141415] border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all rounded-[28px] overflow-hidden">
                <CardContent className="p-7">
                   <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                         {getFileIcon(doc.type)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[9px] uppercase tracking-widest px-2">
                           Drive
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={deleting === doc.id}
                          className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          {deleting === doc.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </div>
                   </div>
                   
                   <div className="space-y-1 mb-8">
                      <h3 className="text-[15px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{doc.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] text-muted-foreground font-medium uppercase">
                           {doc.type || 'Archivo'}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-[0.15em] mt-3">
                         Sincronizado: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                       <a 
                         href={doc.google_drive_link} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className={cn(buttonVariants({ variant: 'outline' }), "rounded-xl font-bold h-11 text-[12px] border-border bg-white/[0.02] hover:bg-white/[0.05] group-hover:border-primary/20 flex items-center justify-center")}
                       >
                         Ver
                       </a>
                       <a 
                         href={doc.google_drive_link} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className={cn(buttonVariants({ variant: 'outline' }), "rounded-xl font-bold h-11 text-[12px] bg-primary/5 border-primary/10 text-primary hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center")}
                       >
                         <Download size={14} className="mr-2" /> Link
                       </a>
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
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Fecha</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-xl">
                          {getFileIcon(doc.type)}
                        </div>
                        <span className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10 font-bold text-[10px] uppercase">
                        {doc.type || 'FILE'}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-[13px] text-muted-foreground font-medium">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={doc.google_drive_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary")}
                        >
                          <Eye size={16} />
                        </a>
                        <a 
                          href={doc.google_drive_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary")}
                        >
                           <Download size={16} />
                        </a>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={deleting === doc.id}
                          className="h-9 w-9 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"
                        >
                          {deleting === doc.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
