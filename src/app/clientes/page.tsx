"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  Filter, 
  Download,
  Mail,
  Phone,
  ArrowUpDown,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { EditClientDialog } from '@/components/clients/EditClientDialog';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setClientes(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente y TODOS los datos asociados (tareas, oportunidades, eventos)? Esta acción es irreversible.')) {
      // Manual cascade delete to ensure no orphan records or FK constraint errors
      await supabase.from('activities').delete().eq('client_id', id);
      await supabase.from('calendar_events').delete().eq('client_id', id);
      await supabase.from('documents').delete().eq('client_id', id);
      await supabase.from('tasks').delete().eq('client_id', id);
      await supabase.from('opportunities').delete().eq('client_id', id);
      
      const { error } = await supabase.from('clients').delete().eq('id', id);
      
      if (error) {
        console.error("Error deleting client:", error);
        alert(`No se pudo eliminar el cliente.\n\nError técnico: ${error.message}`);
      } else {
        fetchClientes();
      }
    }
  };

  const filteredClientes = clientes.filter(c => 
    `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Cerrado': return 'success';
      case 'Perdido': return 'danger';
      case 'Negociación':
      case 'Propuesta':
      case 'Pendiente': return 'amber';
      case 'Contactado': return 'process';
      default: return 'secondary';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-[14px] font-medium mt-1">
            {clientes.length} clientes registrados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-lg font-bold text-muted-foreground px-4 bg-transparent border-border hover:bg-muted transition-colors">
            <Download size={16} className="mr-2" /> Exportar
          </Button>
          <NewClientDialog onClientCreated={fetchClientes}>
            <div className="inline-flex items-center justify-center h-10 px-4 rounded-lg font-bold bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all cursor-pointer">
              <UserPlus size={16} className="mr-2" /> Nuevo cliente
            </div>
          </NewClientDialog>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 bg-card border border-border shadow-sm rounded-md overflow-hidden">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1 relative w-full border-b md:border-b-0 md:border-r border-border">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              placeholder="Search..." 
              className="w-full pl-11 pr-4 h-12 bg-transparent text-foreground text-[14px] font-medium outline-none placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center divide-x divide-border h-12">
            <Button variant="ghost" className="h-full px-6 rounded-none text-muted-foreground font-medium text-[13px] hover:bg-muted/50">
              <Filter size={16} className="mr-2" /> Filters
            </Button>
            <Button variant="ghost" className="h-full px-6 rounded-none text-muted-foreground font-medium text-[13px] hover:bg-muted/50">
              <ArrowUpDown size={16} className="mr-2" /> Sort
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Responsive Cards (Mobile) / Table (Desktop) */}
      
      {/* Mobile View: Cards (< lg) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-md animate-pulse h-40" />
          ))
        ) : filteredClientes.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-md text-center">
            <p className="text-muted-foreground font-medium">No clients found</p>
          </div>
        ) : (
          filteredClientes.map((cliente) => (
            <div 
              key={cliente.id} 
              className="bg-card border border-border p-5 rounded-md shadow-sm cursor-pointer active:scale-[0.98] transition-all"
              onClick={() => router.push(`/clientes/${cliente.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {cliente.first_name?.charAt(0)}{cliente.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base">{cliente.first_name} {cliente.last_name || ''}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{cliente.company || 'Individual'}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(cliente.status)} className="rounded bg-muted/50 text-foreground border-border font-medium text-[10px] px-2 py-0.5 uppercase tracking-wider">
                  {cliente.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <div className="flex-1" onClick={e => e.stopPropagation()}>
                  <EditClientDialog client={cliente} onClientUpdated={fetchClientes}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-9 rounded bg-transparent border-border text-primary hover:bg-primary/10 font-semibold text-xs gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </Button>
                  </EditClientDialog>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); handleDeleteClient(cliente.id); }}
                  className="flex-1 h-9 rounded bg-transparent border-border text-red-400 hover:bg-red-400/10 font-semibold text-xs gap-2"
                >
                  <Trash2 size={14} /> Borrar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table (>= lg) */}
      <div className="hidden lg:block bg-card border border-border shadow-sm rounded-md overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Listado de Clientes</h2>
          <span className="text-xs text-muted-foreground">Clientes / Gestionar</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Title / Company</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-16 bg-muted/10" />
                  </tr>
                ))
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-muted-foreground font-medium">No clients found</p>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr 
                    key={cliente.id} 
                    className="group hover:bg-muted/30 transition-all cursor-pointer"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-[10px]">
                          {cliente.first_name?.charAt(0)}{cliente.last_name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-[14px] text-foreground">{cliente.first_name} {cliente.last_name || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground text-[14px] font-medium">{cliente.company || 'Individual'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-foreground text-[14px] font-medium">{cliente.email || 'No email'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(cliente.status)} className="rounded bg-muted/50 text-foreground border-border font-medium px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {cliente.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div onClick={e => e.stopPropagation()}>
                          <EditClientDialog client={cliente} onClientUpdated={fetchClientes} />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(cliente.id); }}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          title="Borrar cliente"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-card flex items-center justify-between border-t border-border">
          <p className="text-[12px] font-medium text-muted-foreground">
            Showing {filteredClientes.length} entries
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 px-3 rounded text-[13px] bg-transparent font-medium text-muted-foreground border-border opacity-50">Previous</Button>
            <Button variant="outline" size="sm" disabled className="h-8 px-3 rounded text-[13px] bg-transparent font-medium text-muted-foreground border-border opacity-50">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
