"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, UserPlus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewClientDialog } from '@/components/clients/NewClientDialog';
import { NewOpportunityDialog } from '@/components/opportunities/NewOpportunityDialog';
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      // Usamos window.location.href para asegurar que se limpie todo el estado
      // y que el AuthWrapper detecte la falta de sesión al recargar la raíz.
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Fallback en caso de error: intentar redirigir de todos modos
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const initials = userProfile?.name 
    ? userProfile.name.substring(0, 2).toUpperCase() 
    : '??';
  
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/clientes': return 'Clientes';
      case '/pipeline': return 'Pipeline';
      case '/calendario': return 'Calendario';
      case '/tareas': return 'Trabajos';
      case '/telegram': return 'Telegram Chat';
      case '/ajustes': return 'Ajustes';
      case '/documentos': return 'Documentos';
      default: return 'Detalles';
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Clientes', href: '/clientes' },
    { name: 'Documentos', href: '/documentos' },
    ...(userProfile?.role === 'admin' ? [{ name: 'Equipo', href: '/equipo' }] : []),
    { name: 'Pipeline', href: '/pipeline' },
    { name: 'Calendario', href: '/calendario' },
    { name: 'Trabajos', href: '/tareas' },
    { name: 'Telegram', href: '/telegram' },
    { name: 'Ajustes', href: '/ajustes' },
  ];

  return (
    <header className="h-[56px] bg-card border-b border-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-40">
      {/* Mobile Toggle */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger 
            render={
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 outline-none transition-colors">
                <Menu size={16} strokeWidth={2.5} />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-56 mt-2 ml-4 rounded-xl border-border bg-card shadow-xl overflow-hidden">
            <DropdownMenuLabel className="font-bold text-foreground px-3 py-2">Menú</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <div className="py-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <DropdownMenuItem className={`mx-1 rounded-md cursor-pointer font-medium px-3 py-2 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground focus:text-foreground focus:bg-muted/50'}`}>
                      {item.name}
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span className="text-[15px] font-bold text-foreground truncate max-w-[120px] sm:max-w-none">
        {getPageTitle(pathname)}
      </span>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
          <input 
            placeholder="Buscar..." 
            className="h-9 w-[180px] pl-9 pr-4 rounded-lg border border-border bg-background text-[12px] outline-none text-foreground placeholder:text-muted-foreground transition-all focus:w-[220px] focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 border-l border-border ml-2 pl-3">
          <NewClientDialog>
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
              <UserPlus size={16} />
            </div>
          </NewClientDialog>

          {/* Notif */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted relative transition-all outline-none">
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 border-2 border-card flex items-center justify-center text-[9px] text-white font-bold animate-in zoom-in">
                      {unreadCount}
                    </div>
                  )}
                </button>
              }
            />
            <DropdownMenuContent className="w-80 rounded-xl p-0 border-border bg-card shadow-xl mr-2 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <span className="font-bold text-[13px] text-foreground">Notificaciones</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[11px] font-medium text-primary hover:underline">
                    Marcar todas leídas
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.filter(n => !n.read).length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    No tienes notificaciones pendientes
                  </div>
                ) : (
                  notifications.filter(n => !n.read).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className="px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors bg-primary/5"
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="text-[12px] font-semibold text-primary">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger 
            render={
              <button className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-bold text-[12px] cursor-pointer ring-2 ring-background shadow-sm hover:scale-105 transition-transform border-0 p-0 outline-none">
                {initials}
              </button>
            } 
          />
          <DropdownMenuContent className="w-56 rounded-md p-2 border-border bg-card shadow-xl">
            <DropdownMenuLabel className="font-bold text-foreground px-2 py-1.5">Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <Link href="/ajustes">
              <DropdownMenuItem className="rounded-lg cursor-pointer font-medium text-muted-foreground focus:text-primary focus:bg-primary/10 transition-colors">
                Perfil
              </DropdownMenuItem>
            </Link>
            <Link href="/ajustes">
              <DropdownMenuItem className="rounded-lg cursor-pointer font-medium text-muted-foreground focus:text-primary focus:bg-primary/10 transition-colors">
                Notificaciones
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg cursor-pointer font-bold text-red-400 focus:text-red-300 focus:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
