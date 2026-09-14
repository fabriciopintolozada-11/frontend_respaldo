import { describe, expect, it } from 'vitest';

import { isDiscountActive } from './adjustments';
import type { SettlementAdjustmentSummary } from '../api/settlement.types';

function adjustment(overrides: Partial<SettlementAdjustmentSummary>): SettlementAdjustmentSummary {
  return {
    id: 'adj',
    type: 'DISCOUNT',
    amount: '100.00',
    reason: 'Motivo',
    createdAt: '2026-09-12T12:00:00.000Z',
    ...overrides,
  };
}

describe('isDiscountActive (US-20 / RN-15)', () => {
  const single = [adjustment({ id: 'd1', amount: '100.00' })];

  it('keeps a discount active while there is no void', () => {
    expect(isDiscountActive(single, 0)).toBe(true);
  });

  it('marks the discount as inactive once a void matches its amount', () => {
    const adjustments = [
      ...single,
      adjustment({ id: 'v1', type: 'VOID', amount: '100.00' }),
    ];
    expect(isDiscountActive(adjustments, 0)).toBe(false);
  });

  it('keeps the discount active when the void only covers part of it', () => {
    const adjustments = [
      ...single,
      adjustment({ id: 'v1', type: 'VOID', amount: '40.00' }),
    ];
    expect(isDiscountActive(adjustments, 0)).toBe(true);
  });

  it('applies void coverage FIFO across multiple discounts', () => {
    const adjustments = [
      adjustment({ id: 'd1', amount: '100.00' }),
      adjustment({ id: 'd2', amount: '50.00' }),
      adjustment({ id: 'v1', type: 'VOID', amount: '120.00' }),
    ];
    // 100 of the 120 coverage is consumed by d1; d2 keeps 30 of its 50.
    expect(isDiscountActive(adjustments, 0)).toBe(false);
    expect(isDiscountActive(adjustments, 1)).toBe(true);
  });

  it('returns false for VOID entries themselves', () => {
    const adjustments = [
      single[0],
      adjustment({ id: 'v1', type: 'VOID', amount: '100.00' }),
    ];
    expect(isDiscountActive(adjustments, 1)).toBe(false);
  });
});