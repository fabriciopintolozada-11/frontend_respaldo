import { NavLink, Outlet } from 'react-router';
import { Car, ClipboardCheck, ClipboardPlus, FileText, Globe, LogOut, RotateCcw, Wrench, User as UserIcon } from 'lucide-react';

import { useWorkshop } from '../state/WorkshopContext';
import { useToast } from '../shared/components/ToastContext';
import { useAuthContext } from '../features/auth/context/AuthContext';
import type { UserRole } from '../features/auth/api/auth-api';

const ROLE_NAV: { to: string; label: string; icon: JSX.Element; roles?: UserRole[] }[] = [
  { to: '/recepcion', label: 'Recepción', icon: <ClipboardPlus className="w-4 h-4" />, roles: ['RECEPTIONIST', 'ADMIN'] },
  { to: '/taller', label: 'Jefe de Taller', icon: <Car className="w-4 h-4" />, roles: ['WORKSHOP_LEAD', 'ADMIN'] },
  { to: '/mecanico', label: 'Mecánico', icon: <Wrench className="w-4 h-4" />, roles: ['MECHANIC', 'ADMIN'] },
  { to: '/ots', label: 'Órdenes de Trabajo', icon: <FileText className="w-4 h-4" />, roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'] },
  { to: '/presupuestos', label: 'Aprobaciones', icon: <ClipboardCheck className="w-4 h-4" />, roles: ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'] },
  { to: '/consulta', label: 'Portal Cliente', icon: <Globe className="w-4 h-4" /> },
];

export function WorkshopLayout() {
  const toast = useToast();
  const { resetData } = useWorkshop();
  const { user, logout } = useAuthContext();

  const NAV_ITEMS = ROLE_NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const handleReset = () => {
    if (window.confirm('¿Desea restablecer todos los datos del taller al estado inicial con ejemplos?')) {
      resetData();
      toast.info('Datos Restablecidos', 'Se reiniciaron las órdenes, bahías e inventario.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-3 cursor-pointer group">
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
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] whitespace-nowrap ${
                      isActive
                        ? 'bg-lime-400 text-lime-950 shadow-sm shadow-lime-950/10'
                        : item.to === '/'
                          ? 'bg-lime-50 text-lime-800 border border-lime-200 hover:bg-lime-100'
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
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-lime-100 border border-lime-200 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-lime-800" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{user.role}</div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleReset}
                title="Reiniciar datos de prueba"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-lime-700 hover:border-lime-300 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={logout}
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
            {NAV_ITEMS.map((item) => (
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
            <strong className="text-slate-900">Taller Mecánico "Los Fratelli" S.R.L.</strong>
            <span>— Control de Bahías & OTs</span>
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
