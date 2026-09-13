import { describe, expect, it } from 'vitest';

import type { NavItem } from './workshop-layout';
import { groupNavItemsBySection, isItemActive } from './app-sidebar';

const fakeItems: NavItem[] = [
  {
    to: '/recepcion',
    label: 'Recepción',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'operacion',
  },
  {
    to: '/taller',
    label: 'Jefe de Taller',
    icon: null,
    roles: ['WORKSHOP_LEAD'],
    section: 'taller',
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'gestion',
  },
  {
    to: '/tracking',
    label: 'Portal Cliente',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'sistema',
  },
];

describe('groupNavItemsBySection', () => {
  it('agrupa los items por sección en el orden definido', () => {
    const groups = groupNavItemsBySection(fakeItems);
    expect(groups.map((group) => group.section.id)).toEqual([
      'operacion',
      'taller',
      'gestion',
      'sistema',
    ]);
    expect(groups[0].items.map((item) => item.to)).toEqual(['/recepcion']);
    expect(groups[2].items.map((item) => item.to)).toEqual(['/inventario']);
  });

  it('omite las secciones sin items', () => {
    const groups = groupNavItemsBySection([fakeItems[0]]);
    expect(groups.map((group) => group.section.id)).toEqual(['operacion']);
  });
});

describe('isItemActive', () => {
  const presupuestar: NavItem = {
    to: '/presupuestos/crear',
    label: 'Presupuestar',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'gestion',
  };
  const aprobaciones: NavItem = {
    to: '/presupuestos',
    label: 'Aprobaciones',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'gestion',
  };
  const inventario: NavItem = {
    to: '/inventario',
    label: 'Inventario',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'gestion',
  };
  const alertas: NavItem = {
    to: '/inventario/alertas',
    label: 'Alertas Inventario',
    icon: null,
    roles: ['WORKSHOP_LEAD'],
    section: 'gestion',
  };
  const liquidacion: NavItem = {
    to: '/liquidacion',
    label: 'Liquidación',
    icon: null,
    roles: ['RECEPTIONIST'],
    section: 'operacion',
  };

  it('marca presupuestar sin marcar aprobaciones en /presupuestos/crear', () => {
    expect(isItemActive(presupuestar, '/presupuestos/crear')).toBe(true);
    expect(isItemActive(aprobaciones, '/presupuestos/crear')).toBe(false);
  });

  it('marca aprobaciones sin marcar presupuestar en /presupuestos', () => {
    expect(isItemActive(aprobaciones, '/presupuestos')).toBe(true);
    expect(isItemActive(presupuestar, '/presupuestos')).toBe(false);
  });

  it('conserva aprobaciones activo en el detalle /presupuestos/:orderId', () => {
    expect(isItemActive(aprobaciones, '/presupuestos/abc')).toBe(true);
  });

  it('conserva presupuestar activo en la edición /presupuestos/crear/:orderId', () => {
    expect(isItemActive(presupuestar, '/presupuestos/crear/abc')).toBe(true);
  });

  it('marca alertas sin marcar inventario en /inventario/alertas', () => {
    expect(isItemActive(alertas, '/inventario/alertas')).toBe(true);
    expect(isItemActive(inventario, '/inventario/alertas')).toBe(false);
  });

  it('conserva inventario activo exacto en /inventario', () => {
    expect(isItemActive(inventario, '/inventario')).toBe(true);
    expect(isItemActive(alertas, '/inventario')).toBe(false);
  });

  it('conserva liquidacion activo en el detalle /liquidacion/:orderId', () => {
    expect(isItemActive(liquidacion, '/liquidacion/abc')).toBe(true);
  });
});