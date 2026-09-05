import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  BellRing,
  Car,
  ClipboardCheck,
  ClipboardPlus,
  FileEdit,
  FileText,
  Globe,
  LogOut,
  Package,
  Wrench,
} from 'lucide-react';

import { useWorkshop } from '../state/WorkshopContext';
import { useToast } from '../shared/components/ToastContext';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { UserRole } from '../shared/types/openapi';

const ALL_ROLES: UserRole[] = ['RECEPTIONIST', 'MECHANIC', 'WORKSHOP_LEAD', 'ADMIN'];

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: UserRole[];
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
  },
  {
    to: '/taller',
    label: 'Jefe de Taller',
    icon: <Car className="w-4 h-4" />,
    roles: ['WORKSHOP_LEAD', 'ADMIN'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: <Package className="w-4 h-4" />,
    roles: ['WORKSHOP_LEAD', 'ADMIN'],
  },
  {
    to: '/inventario/alertas',
    label: 'Alertas Inventario',
    icon: <BellRing className="w-4 h-4" />,
    roles: ['WORKSHOP_LEAD', 'ADMIN'],
  },
  {
    to: '/mecanico',
    label: 'Mecánico',
    icon: <Wrench className="w-4 h-4" />,
    roles: ['MECHANIC'],
  },
  {
    to: '/ots',
    label: 'Órdenes de Trabajo',
    icon: <FileText className="w-4 h-4" />,
    roles: ALL_ROLES,
  },
  {
    to: '/presupuestos/crear',
    label: 'Presupuestar',
    icon: <FileEdit className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
  },
  {
    to: '/presupuestos',
    label: 'Aprobaciones',
    icon: <ClipboardCheck className="w-4 h-4" />,
    roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'],
  },
  {
    to: '/consulta',
    label: 'Portal Cliente',
    icon: <Globe className="w-4 h-4" />,
    roles: ALL_ROLES,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  RECEPTIONIST: 'Recepcionista',
  MECHANIC: 'Mecánico',
  WORKSHOP_LEAD: 'Jefe de Taller',
  ADMIN: 'Administrador',
};

export function WorkshopLayout() {
  const toast = useToast();
  const { resetData } = useWorkshop();
  const { user, logout } = useAuth();

  const filteredNavItems = user
    ? filterNavItemsByRole(NAV_ITEMS, user.role)
    : [];

  const handleReset = () => {
    if (window.confirm('¿Desea restablecer todos los datos del taller al estado inicial con ejemplos?')) {
      resetData();
      toast.info('Datos Restablecidos', 'Se reiniciaron las órdenes, bahías e inventario.');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/taller" className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-lime-950 shadow-sm group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-lime-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">LOS FRATELLI</span>
                  <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">| Gestión de Taller</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-lime-50 border border-lime-200 rounded-full text-[10px] font-semibold text-lime-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                    4 BAHÍAS
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Vehículos Livianos</p>
              </div>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1.5">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] whitespace-nowrap ${
                      isActive
                        ? 'bg-lime-400 text-lime-950 shadow-sm shadow-lime-950/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user && (
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <div className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center text-lime-800 text-[10px] font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-700 leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{ROLE_LABELS[user.role]}</p>
                  </div>
                </div>
              )}
              {(user?.role === 'WORKSHOP_LEAD' || user?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="Reiniciar datos de prueba"
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-lime-700 hover:border-lime-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <span className="sr-only">Reiniciar datos</span>
                  <span className="text-sm">↻</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] whitespace-nowrap ${
                    isActive ? 'bg-lime-400 text-lime-950' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lime-500" />
            <strong className="text-slate-900">Taller Mecánico &quot;Los Fratelli&quot; S.R.L.</strong>
            <span>— Control de Bahías &amp; OTs</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>La Paz, Bolivia</span>
            <span>•</span>
            <span>Moneda: BOB</span>
            <div className="flex items-center gap-2 bg-lime-50 px-3 py-1 rounded-lg border border-lime-200">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[11px] text-lime-800 font-bold">4 Bahías Operativas</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
