"use client";

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

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useAuth();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      default: return 'Detalles';
    }
  };

  return (
    <header className="h-[56px] bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Mobile Toggle Placeholder */}
      <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80">
        <Menu size={16} strokeWidth={2.5} />
      </button>

      <span className="text-[15px] font-bold text-foreground">
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
          <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted relative transition-all">
            <Bell size={15} />
            <div className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 border border-card" />
          </button>
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
              className="rounded-lg cursor-pointer font-bold text-red-400 focus:text-red-300 focus:bg-red-500/10 transition-colors"
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
