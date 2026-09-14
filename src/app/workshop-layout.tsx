import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  BadgeCheck,
  BellRing,
  Car,
  ClipboardPlus,
  DollarSign,
  FileEdit,
  Globe,
  Menu,
  Package,
  Search,
  Wrench,
  X,
} from 'lucide-react';

import { useAuth } from '../features/auth/hooks/useAuth';
import type { UserRole } from '../shared/types/openapi';
import { AppSidebar } from './app-sidebar';

const ALL_ROLES: UserRole[] = ['RECEPTIONIST', 'MECHANIC', 'WORKSHOP_LEAD', 'ADMIN'];

export type NavSection = 'operacion' | 'taller' | 'gestion' | 'sistema';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
  section: NavSection;
}

export function filterNavItemsByRole(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/recepcion',
    label: 'Recepción',
    icon: <ClipboardPlus className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
    section: 'operacion',
  },
  {
    to: '/seguimiento',
    label: 'Seguimiento',
    icon: <Search className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
    section: 'operacion',
  },
  {
    // US-20: settlement of ready work orders. Visible to roles that can see
    // monetary values (RN-16 / FE-18).
    to: '/liquidacion',
    label: 'Liquidación',
    icon: <DollarSign className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
    section: 'operacion',
  },
  {
    to: '/taller',
    label: 'Jefe de Taller',
    icon: <Car className="w-4 h-4" />,
    // US-00: the workshop head board is exclusive to WORKSHOP_LEAD.
    roles: ['WORKSHOP_LEAD'],
    section: 'taller',
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: <Package className="w-4 h-4" />,
    // US-23: catalog consultation is available to every role; the view hides
    // management actions and prices for unauthorized roles (RN-16, FE-18).
    roles: ALL_ROLES,
    section: 'gestion',
  },
  {
    to: '/inventario/alertas',
    label: 'Alertas Inventario',
    icon: <BellRing className="w-4 h-4" />,
    roles: ['WORKSHOP_LEAD', 'ADMIN'],
    section: 'gestion',
  },
  {
    to: '/mecanico',
    label: 'Mecánico',
    icon: <Wrench className="w-4 h-4" />,
    roles: ['MECHANIC'],
    section: 'taller',
  },
  {
    to: '/presupuestos/crear',
    label: 'Presupuestar',
    icon: <FileEdit className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
    section: 'gestion',
  },
  {
    to: '/presupuestos',
    label: 'Aprobaciones',
    icon: <BadgeCheck className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'ADMIN'],
    section: 'gestion',
  },
  {
    to: '/tracking',
    label: 'Portal Cliente',
    icon: <Globe className="w-4 h-4" />,
    roles: ALL_ROLES,
    section: 'sistema',
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  RECEPTIONIST: 'Recepcionista',
  MECHANIC: 'Mecánico',
  WORKSHOP_LEAD: 'Jefe de Taller',
  ADMIN: 'Administrador',
};

export function WorkshopLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavItems = user
    ? filterNavItemsByRole(NAV_ITEMS, user.role)
    : [];

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!sidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Abrir menú"
              aria-label="Abrir menú"
              aria-expanded={sidebarOpen}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <NavLink
              to="/taller"
              className="flex items-center gap-3 cursor-pointer group shrink-0 pr-0 lg:pr-6 lg:border-r border-slate-200"
            >
              <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-lime-950 shadow-sm group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-lime-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-wide whitespace-nowrap text-slate-900">LOS FRATELLI</span>
                  <span className="text-[10px] font-semibold text-slate-500 hidden xl:inline">| Gestión de Taller</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Vehículos Livianos</p>
              </div>
            </NavLink>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <div className="flex items-center gap-2 mr-1 lg:mr-0">
                <div className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center text-lime-800 text-[10px] font-bold shrink-0">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-right hidden lg:block">
                  <p className="text-[11px] font-bold text-slate-700 leading-tight whitespace-nowrap">{user.fullName}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* ===== SIDEBAR DESKTOP (lg+) ===== */}
        <aside className="hidden lg:block shrink-0 w-60 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 bg-white">
          <AppSidebar items={filteredNavItems} onLogout={handleLogout} />
        </aside>

        {/* ===== MENÚ MÓVIL (drawer) ===== */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!sidebarOpen}
        >
          <div
            className={`absolute inset-0 bg-lime-950/60 backdrop-blur-sm transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl border-r border-slate-200 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <span className="font-extrabold text-sm tracking-wide text-slate-900">LOS FRATELLI</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                title="Cerrar menú"
                aria-label="Cerrar menú"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <AppSidebar
              items={filteredNavItems}
              onNavigate={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lime-500" />
            <strong className="text-slate-900">Taller Mecánico &quot;Los Fratelli&quot; S.R.L.</strong>
            <span>— Gestión de OTs, Presupuestos e Inventario</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>La Paz, Bolivia</span>
            <span>•</span>
            <span>Moneda: BOB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}