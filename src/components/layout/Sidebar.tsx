"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText,
  Split, 
  CheckSquare, 
  Calendar,
  Settings,
  ChevronDown,
  LogOut,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Clientes', icon: Users, href: '/clientes' },
    { name: 'Documentos', icon: FileText, href: '/documentos' },
    ...(userProfile?.role === 'admin' ? [{ name: 'Equipo', icon: Users, href: '/equipo' }] : []),
    { name: 'Pipeline', icon: Split || LayoutDashboard, href: '/pipeline' },
    { name: 'Calendario', icon: Calendar, href: '/calendario' },
    { name: 'Trabajos', icon: CheckSquare, href: '/tareas' },
    { name: 'Telegram', icon: Bot, href: '/telegram' },
    { name: 'Ajustes', icon: Settings, href: '/ajustes' },
  ];

  return (
    <aside className="hidden lg:flex w-[240px] bg-background text-muted-foreground flex flex-col border-r border-border h-screen sticky top-0">
      {/* Brand */}
      <div className="h-[56px] px-6 flex items-center gap-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span className="text-foreground font-extrabold text-lg tracking-tight">NexusCRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 font-medium text-[13px]",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {Icon && <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary-foreground" : "text-inherit group-hover:text-foreground"
              )} />}
              {item.name}
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-primary-foreground/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-all group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-border">
            JR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate">Juan Rodríguez</p>
            <p className="text-[10px] font-medium text-muted-foreground truncate">Admin Agencia</p>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </aside>
  );
}
