"use client";

import { useState } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  LogOut, 
  Smartphone, 
  Monitor, 
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordForm.newPassword 
      });

      if (error) throw error;

      toast.success('Contraseña actualizada', {
        description: 'Se ha cambiado tu clave de acceso correctamente.'
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error('Error al actualizar', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    const confirmed = confirm('¿Estás seguro de que quieres cerrar sesión en todos los dispositivos? Deberás volver a entrar en esta sesión también.');
    if (!confirmed) return;

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      window.location.href = '/login';
    } catch (error: any) {
      toast.error('Error al cerrar sesiones', {
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Password Change Card */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Cambiar Contraseña</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Actualiza tus credenciales de acceso</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-black text-neutral-400 uppercase ml-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-neutral-400" size={16} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all rounded-xl"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-black text-neutral-400 uppercase ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-neutral-400" size={16} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all rounded-xl"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="nc-btn nc-btn-primary h-11 px-8 shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Actualizando...</>
              ) : 'Actualizar Contraseña'}
            </Button>
          </div>
        </form>
      </div>

      {/* Active Sessions Card */}
      <div className="nc-card p-0 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Monitor size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">Sesiones Activas</h3>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-tight">Dispositivos con acceso a tu cuenta</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOutAll}
            className="h-9 text-[12px] font-bold border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            Cerrar todo
          </Button>
        </div>

        <div className="divide-y divide-neutral-100">
          <div className="p-6 flex items-center justify-between group hover:bg-neutral-50/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 text-neutral-500 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                <Monitor size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-bold text-neutral-900">Chrome en macOS</h4>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Actual</span>
                </div>
                <p className="text-[12px] text-neutral-500">Madrid, España • IP: 84.123.XX.XX</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-neutral-400">Última actividad</p>
              <p className="text-[12px] text-neutral-900">Ahora mismo</p>
            </div>
          </div>

          <div className="p-6 flex items-center justify-between group hover:bg-neutral-50/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-neutral-100 text-neutral-500 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                <Smartphone size={24} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-neutral-900">iPhone 15 Pro</h4>
                <p className="text-[12px] text-neutral-500">Telegram Bot • Vinculado</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-bold text-neutral-400">Última actividad</p>
              <p className="text-[12px] text-neutral-900">Hace 5 minutos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Security Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="nc-card border-l-4 border-l-amber-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-neutral-900">Verificación en dos pasos</h4>
              <p className="text-[13px] text-neutral-500 mt-1">Añade una capa extra de seguridad a tu cuenta usando una app de autenticación.</p>
              <Button variant="outline" className="mt-4 h-9 text-[12px] font-bold opacity-50 cursor-not-allowed">
                Próximamente
              </Button>
            </div>
          </div>
        </div>

        <div className="nc-card border-l-4 border-l-red-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-neutral-900">Zona de Peligro</h4>
              <p className="text-[13px] text-neutral-500 mt-1">Si eliminas tu cuenta, todos los datos se borrarán permanentemente y no se podrán recuperar.</p>
              <Button variant="link" className="mt-4 p-0 h-auto text-[12px] font-bold text-red-600 hover:text-red-700">
                Eliminar mi cuenta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
