import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Cog,
  Wallet,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import wobrexxLogo from '@/assets/wobrexx-logo.png';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Services', href: '/services', icon: Briefcase },
  { name: 'Automation', href: '/automation', icon: Cog },
  { name: 'Financials', href: '/financials', icon: Wallet },
  { name: 'Notes', href: '/notes', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={wobrexxLogo} alt="Wobrexx" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm">Wobrexx</h2>
            <p className="text-xs text-sidebar-foreground/60">Operations Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/60')} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2026 Wobrexx</p>
        </div>
      </div>
    </aside>
  );
}
