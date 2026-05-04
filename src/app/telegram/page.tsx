"use client";

import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  Settings, 
  CheckCircle2,
  AlertTriangle,
  Plus,
  Bot,
  Activity,
  Users,
  Copy,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateLinkCode, listTelegramUsers, listTelegramLogs } from '@/lib/agent/actions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export const dynamic = "force-dynamic";

export default function TelegramAgentPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        listTelegramUsers(),
        listTelegramLogs(15)
      ]);
      
      if (usersRes.data) setUsers(usersRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching telegram data:', error);
      toast.error("Error al cargar datos del agente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      if (!user) throw new Error("No hay usuario autenticado");
      
      const res = await generateLinkCode(user.id);
      if (res.error) throw new Error(res.error);
      
      setLinkCode(res.code);
      toast.success("Código de vinculación generado");
    } catch (error: any) {
      toast.error(error.message || "Error al generar código");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h2 className="nc-section-title">IA Workspace</h2>
          <h1 className="nc-section-name">Agente Telegram</h1>
          <p className="nc-section-desc">Gestiona el bot inteligente y monitorea las interacciones por lenguaje natural.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="nc-btn nc-btn-secondary h-11"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Dialog>
            <DialogTrigger render={
              <Button className="nc-btn nc-btn-primary h-11 px-6 shadow-lg shadow-primary-500/20">
                <Plus size={18} className="mr-2" /> Vincular Dispositivo
              </Button>
            } />
            <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <ShieldCheck size={24} />
                  </div>
                  Vincular Telegram
                </DialogTitle>
                <DialogDescription className="text-neutral-500 font-bold text-sm pt-4">
                  Genera un código de un solo uso para autorizar tu cuenta de Telegram en este CRM.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                {!linkCode ? (
                  <Button 
                    onClick={handleGenerateCode} 
                    disabled={generating}
                    className="nc-btn nc-btn-primary w-full h-14 text-sm uppercase tracking-widest font-black"
                  >
                    {generating ? "Generando..." : "Generar Código de Acceso"}
                  </Button>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                      <span className="text-5xl font-black tracking-[0.2em] text-primary-600 mb-2">{linkCode}</span>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> Expira en 15 minutos
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-neutral-600 text-center leading-relaxed">
                      Escribe <code className="bg-neutral-100 px-2 py-1 rounded text-primary-600 font-mono">/vincular {linkCode}</code> en el bot de Telegram <span className="font-black">@elitoria_bot</span>
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(`/vincular ${linkCode}`)}
                      className="w-full h-12 rounded-xl border-neutral-200 font-black text-[11px] uppercase tracking-widest"
                    >
                      <Copy size={16} className="mr-2" /> Copiar Comando
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Status Card */}
        <div className="nc-card bg-primary-500 text-white border-none shadow-xl shadow-primary-500/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bot size={24} className="text-white" />
               </div>
               <span className="nc-badge bg-green-400 text-white border-transparent uppercase tracking-widest animate-pulse">LIVE</span>
            </div>
            <p className="text-2xl font-black tracking-tight mb-2">Nexus Agent Activo</p>
            <p className="text-primary-100 text-[13px] font-bold leading-relaxed">Webhook operativo.<br />Sincronizado con Groq Llama-3</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Quick Stats */}
        <div className="nc-card group hover:border-primary-500/30 transition-all">
          <div className="flex items-center justify-between mb-6 text-neutral-400 group-hover:text-primary-500 transition-colors">
             <Users size={24} />
             <Activity size={18} className="opacity-50" />
          </div>
          <p className="text-2xl font-black text-neutral-900 tracking-tight">{users.length} Usuarios</p>
          <p className="text-neutral-400 text-[13px] font-bold mt-1 uppercase tracking-tight">Cuentas vinculadas actualmente</p>
          <div className="mt-4 flex -space-x-2">
            {users.map((u, i) => (
              <div key={u.id} className={`w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform hover:-translate-y-1 ${i % 2 === 0 ? 'bg-primary-500' : 'bg-neutral-900'}`}>
                {u.users?.email?.substring(0, 1).toUpperCase() || 'U'}
              </div>
            ))}
            {users.length === 0 && <span className="text-[10px] font-bold text-neutral-400">Nadie vinculado aún</span>}
          </div>
        </div>

        <div className="nc-card group hover:border-amber-500/30 transition-all border-l-4 border-l-amber-500">
           <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                 <ShieldAlert size={24} />
              </div>
              <span className="nc-badge bg-amber-100 text-amber-600 border-amber-200 uppercase tracking-widest">Seguridad</span>
           </div>
          <p className="text-2xl font-black text-neutral-900 tracking-tight">Modo Estricto</p>
          <p className="text-neutral-400 text-[13px] font-bold mt-1 uppercase tracking-tight">Solo usuarios verificados pueden operar</p>
          <Button variant="ghost" className="mt-6 w-full rounded-xl bg-amber-50 text-amber-600 font-black text-[11px] hover:bg-amber-100 uppercase tracking-widest h-10">Ver Seguridad</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Authorized Users */}
        <div className="nc-card p-0 overflow-hidden min-h-[400px]">
          <div className="p-8 pb-4 flex items-center justify-between mb-4">
             <h3 className="text-lg font-black text-neutral-900">Managers Autorizados</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-neutral-50/50 border-b border-neutral-100">
                   <tr>
                      <th className="px-8 py-4 nc-label mb-0">Email CRM</th>
                      <th className="px-8 py-4 nc-label mb-0 text-center">Estado</th>
                      <th className="px-8 py-4 nc-label mb-0 text-right">Vinculado el</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                   {users.length > 0 ? users.map(u => (
                      <tr key={u.id} className="group hover:bg-neutral-50 transition-colors">
                         <td className="px-8 py-5">
                            <div className="flex flex-col">
                               <span className="font-bold text-neutral-900 text-[14px]">{u.users?.email}</span>
                               <span className="font-bold text-primary-500 text-[11px] font-mono">TG-ID: {u.telegram_user_id}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <span className="nc-badge bg-green-50 text-green-600 border-green-100 uppercase tracking-tighter shadow-sm">Activo</span>
                         </td>
                         <td className="px-8 py-5 text-right font-bold text-[11px] text-neutral-400">
                            {new Date(u.created_at).toLocaleDateString()}
                         </td>
                      </tr>
                   )) : (
                     <tr>
                       <td colSpan={3} className="px-8 py-20 text-center text-neutral-400 font-bold text-sm">
                         No hay managers vinculados todavía
                       </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="nc-card min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-black text-neutral-900">Logs del Agente Inteligente</h3>
             <Button variant="ghost" size="sm" className="rounded-xl font-bold text-[11px] text-neutral-400 hover:text-neutral-800 uppercase tracking-widest">
               <History size={16} className="mr-2" /> Historial Completo
             </Button>
          </div>
          <div className="space-y-4">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-5 rounded-2xl bg-neutral-50/50 border border-neutral-100 group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`mt-1 w-11 h-11 rounded-xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center transition-all ${log.role === 'user' ? 'text-primary-500 group-hover:bg-primary-500 group-hover:text-white' : 'text-purple-500 group-hover:bg-purple-500 group-hover:text-white'}`}>
                  {log.role === 'user' ? <MessageSquare size={20} /> : <Bot size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{log.role === 'user' ? 'Usuario' : 'Agente IA'}</p>
                    <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-tighter">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[14px] font-black text-neutral-800 leading-snug truncate-3-lines">
                    {log.content.length > 150 ? log.content.substring(0, 150) + '...' : log.content}
                  </p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-neutral-400 font-bold text-sm">
                No hay actividad registrada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
