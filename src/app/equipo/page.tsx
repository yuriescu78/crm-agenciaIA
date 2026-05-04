"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  UserPlus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download,
  Edit2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function EquipoPage() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New User Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Form state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('user');

  // Password reset state
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role: 'admin' })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al crear socio');

      setIsDialogOpen(false);
      setEmail(''); setPassword(''); setName('');
      setTimeout(() => fetchUsers(), 1500); // Wait for postgres trigger
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    
    try {
      const res = await fetch('/api/equipo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Contraseña actualizada correctamente");
      setResettingUserId(null);
      setNewPassword('');
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('users').update({ name: editName, role: editRole }).eq('id', editingUser.id);
      if (error) throw error;
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar a este socio? Perderá el acceso al CRM.')) return;
    
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) fetchUsers();
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-in fade-in duration-500 text-center">
        <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-black text-foreground tracking-tight mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground font-medium">
          Solo los administradores pueden gestionar el equipo y las contraseñas.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    `${u.name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Gestión de Equipo</h1>
          <p className="text-muted-foreground text-[14px] font-medium mt-1">
            {users.length} socios registrados en el sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-lg font-bold text-muted-foreground px-4 bg-transparent border-border hover:bg-muted transition-colors">
            <Download size={16} className="mr-2" /> Exportar
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button className="h-10 px-4 rounded-lg font-bold bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all cursor-pointer">
                <UserPlus size={16} className="mr-2" /> Nuevo socio
              </Button>
            } nativeButton={true} />
            <DialogContent className="sm:max-w-[450px] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <DialogHeader className="p-8 pb-4 border-b border-border bg-card">
                <DialogTitle className="text-xl font-bold">Alta de Socio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-5 p-8 pt-6 bg-card">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                  <Input 
                    value={name} onChange={e => setName(e.target.value)} required
                    placeholder="Ej. Carlos" className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                  <Input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="carlos@agencia.com" className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contraseña temporal</label>
                  <Input 
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••" className="h-12 rounded-xl border-border bg-background" minLength={6}
                  />
                </div>
                <DialogFooter className="pt-6 border-t border-border mt-8 flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold bg-primary">
                    {isSubmitting ? 'Creando...' : 'Crear Socio'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="sm:max-w-[450px] bg-card border-border p-0 overflow-hidden shadow-2xl">
              <DialogHeader className="p-8 pb-4 border-b border-border bg-card">
                <DialogTitle className="text-xl font-bold">Editar Socio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditUser} className="space-y-5 p-8 pt-6 bg-card">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nombre</label>
                  <Input 
                    value={editName} onChange={e => setEditName(e.target.value)} required
                    className="h-12 rounded-xl border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Rol en el CRM</label>
                  <select 
                    value={editRole} onChange={e => setEditRole(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="admin">Administrador</option>
                    <option value="user">Socio (Usuario)</option>
                  </select>
                </div>
                <DialogFooter className="pt-6 border-t border-border mt-8 flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="h-12 px-6 rounded-xl font-bold bg-primary">
                    {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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

      {/* Main Content: Table (Desktop/Mobile unified for now based on clients style) */}
      <div className="bg-card border border-border shadow-sm rounded-md overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Pro Tables</h2>
          <span className="text-xs text-muted-foreground">Dashboard / Pro Tables</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6 h-16 bg-muted/10" />
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground font-medium">
                    No hay socios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                          {u.name?.charAt(0) || u.email?.charAt(0)}
                        </div>
                        <div className="font-semibold text-[14px] text-foreground flex items-center gap-2">
                          {u.name} 
                          {u.id === user?.id && <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-primary/20">Tú</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-foreground text-[14px] font-medium">{u.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-foreground text-[14px] font-medium">{u.role === 'admin' ? 'Administrador' : 'Socio'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="rounded bg-muted/50 text-foreground border-border font-medium px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        ACTIVO
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        {resettingUserId === u.id ? (
                          <div className="flex gap-2 items-center">
                            <Input 
                              type="password" 
                              placeholder="Nueva clave" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-8 w-28 text-xs bg-background"
                            />
                            <Button size="sm" onClick={() => handleResetPassword(u.id)} className="h-8 bg-primary">Ok</Button>
                            <Button size="sm" variant="ghost" onClick={() => setResettingUserId(null)} className="h-8">X</Button>
                          </div>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditName(u.name); setEditRole(u.role); setEditingUser(u); }} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setResettingUserId(u.id); setNewPassword(''); }} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                              <Key size={14} />
                            </Button>
                            {u.id !== user?.id && (
                              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(u.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10">
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </>
                        )}
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
            Showing {filteredUsers.length} entries
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
