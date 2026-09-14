import { LogOut } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

import type { NavItem, NavSection } from './workshop-layout';

const EXCLUDED_CHILD_PREFIXES: Record<string, string> = {
  '/inventario': '/inventario/alertas',
  '/presupuestos': '/presupuestos/crear',
};

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.to) return true;
  if (!pathname.startsWith(`${item.to}/`)) return false;
  const excluded = EXCLUDED_CHILD_PREFIXES[item.to];
  if (excluded && pathname.startsWith(excluded)) return false;
  return true;
}

export interface NavSectionDef {
  id: NavSection;
  label: string;
}

const NAV_SECTIONS: NavSectionDef[] = [
  { id: 'operacion', label: 'Operación' },
  { id: 'taller', label: 'Taller' },
  { id: 'gestion', label: 'Gestión' },
  { id: 'sistema', label: 'Sistema' },
];

export function groupNavItemsBySection(
  items: NavItem[],
): Array<{ section: NavSectionDef; items: NavItem[] }> {
  return NAV_SECTIONS.map((section) => ({
    section,
    items: items.filter((item) => item.section === section.id),
  })).filter((group) => group.items.length > 0);
}

interface AppSidebarProps {
  items: NavItem[];
  onNavigate?: () => void;
  onLogout?: () => void;
}

export function AppSidebar({ items, onNavigate, onLogout }: AppSidebarProps) {
  const groups = groupNavItemsBySection(items);
  const { pathname } = useLocation();

  return (
    <nav aria-label="Menú principal" className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map(({ section, items: sectionItems }) => (
          <div key={section.id}>
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.label}
            </p>
            <ul className="space-y-1">
              {sectionItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    aria-current={isItemActive(item, pathname) ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isItemActive(item, pathname)
                        ? 'bg-lime-400 text-lime-950 shadow-sm shadow-lime-950/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          className="w-full py-2 px-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-300 transition-all min-h-[44px] flex items-center justify-center gap-2 text-xs font-bold"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </nav>
  );
}