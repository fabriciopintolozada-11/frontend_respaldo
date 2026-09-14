import { describe, expect, it } from 'vitest';

import { filterNavItemsByRole, NAV_ITEMS } from './workshop-layout';

describe('filterNavItemsByRole (FE-18)', () => {
  it('hides the inventory alerts navigation for MECHANIC', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'MECHANIC');
    expect(items.some((item) => item.to === '/inventario/alertas')).toBe(false);
  });

  it('hides the inventory alerts navigation for RECEPTIONIST', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'RECEPTIONIST');
    expect(items.some((item) => item.to === '/inventario/alertas')).toBe(false);
  });

  it('shows the inventory alerts navigation for WORKSHOP_LEAD', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'WORKSHOP_LEAD');
    expect(items.some((item) => item.to === '/inventario/alertas')).toBe(true);
  });

  it('shows the inventory alerts navigation for ADMIN', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'ADMIN');
    expect(items.some((item) => item.to === '/inventario/alertas')).toBe(true);
  });

  it('shows the inventory catalog navigation for every role (US-23, FE-18)', () => {
    for (const role of ['RECEPTIONIST', 'MECHANIC', 'WORKSHOP_LEAD', 'ADMIN'] as const) {
      const items = filterNavItemsByRole(NAV_ITEMS, role);
      expect(items.some((item) => item.to === '/inventario')).toBe(true);
      expect(items.some((item) => item.to === '/inventario/alertas')).toBe(
        role === 'WORKSHOP_LEAD' || role === 'ADMIN',
      );
    }
  });

  it('shows the settlement navigation for roles that see monetary values (US-20, RN-16, FE-18)', () => {
    for (const role of ['RECEPTIONIST', 'WORKSHOP_LEAD', 'ADMIN'] as const) {
      const items = filterNavItemsByRole(NAV_ITEMS, role);
      expect(items.some((item) => item.to === '/liquidacion')).toBe(true);
    }
  });

  it('hides the settlement navigation for MECHANIC (US-20, RN-16)', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'MECHANIC');
    expect(items.some((item) => item.to === '/liquidacion')).toBe(false);
  });

  it('keeps the settlement link before the inventory link in the menu', () => {
    const items = filterNavItemsByRole(NAV_ITEMS, 'WORKSHOP_LEAD');
    const index = items.map((item) => item.to).indexOf('/liquidacion');
    expect(index).toBeGreaterThan(-1);
    expect(items.some((item) => item.to === '/inventario')).toBe(true);
  });
});