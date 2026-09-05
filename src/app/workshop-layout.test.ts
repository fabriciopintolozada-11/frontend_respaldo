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
});