import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  FileText, 
  Calendar, 
  Trophy, 
  LogOut,
  Layers,
  Presentation as PresentationIcon
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  role?: 'ADMIN' | 'JURY';
};

const adminItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Dashboard Jury', icon: LayoutDashboard, path: '/jury' },
  { label: 'Groupes', icon: Layers, path: '/admin/groups' },
  { label: 'Jurys', icon: UserCircle, path: '/admin/jurys' },
  { label: 'Classement', icon: Trophy, path: '/classement' },
  { label: 'Présentation', icon: PresentationIcon, path: '/presentation' },
];

const juryItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/jury' },
  { label: 'Classement', icon: Trophy, path: '/classement' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const items = profile?.role === 'ADMIN' ? adminItems : juryItems;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass m-4 mr-0 rounded-xl flex flex-col p-6 border-r border-[#27272a]">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-[#3f3f46] rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-xl">
             J
          </div>
          <span className="text-xl font-bold tracking-tight text-[#fafafa]">JuryNote</span>
        </div>

        <nav className="flex-1 space-y-4">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="flex items-center gap-4 p-4 mb-6 bg-[#27272a4d] border border-[#27272a] rounded-xl">
            <div className="h-10 w-10 rounded-lg bg-[#27272a] flex items-center justify-center font-bold text-xs text-white">
              {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate text-[#fafafa]">{profile?.name}</span>
              <span className="text-[10px] text-[#71717a] font-bold uppercase tracking-widest">{profile?.role}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-[#a1a1aa] hover:text-[#fafafa] hover:bg-white/5"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-medium text-[#fafafa]">Dashboard</h1>
            <span className="text-[#3f3f46]">/</span>
            <span className="text-[#a1a1aa] text-sm italic">Bienvenue, {profile?.name} 👋</span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#71717a] group-focus-within:text-primary transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="bg-[#18181b] border border-[#27272a] rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary w-64 transition-all text-[#fafafa]"
                />
             </div>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg ring-2 ring-white/10"></div>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>

        <footer className="flex justify-between items-center text-[10px] text-[#52525b] uppercase tracking-[0.2em] pt-12">
          <div className="flex gap-6">
            <span>Session: {profile?.id?.slice(0, 8)}...</span>
            <span>Build: v2.1.0-stable</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Tous les systèmes opérationnels
            </span>
            <span>Dernière mise à jour: {new Date().toLocaleTimeString()}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
