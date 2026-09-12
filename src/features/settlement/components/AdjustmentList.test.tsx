import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  mockSettlementResponse,
  mockVoidAdjustment,
} from '../mocks/settlement.fixtures';
import type { SettlementAdjustmentSummary } from '../api/settlement.types';
import { AdjustmentList } from './AdjustmentList';

const adjustments = mockSettlementResponse.adjustments as SettlementAdjustmentSummary[];

function renderList(overrides: Partial<Parameters<typeof AdjustmentList>[number]> = {}) {
  const base = {
    adjustments,
    canVoid: true,
    onVoid: vi.fn(),
  };
  const props = { ...base, ...overrides };
  render(<AdjustmentList {...props} />);
  return props;
}

describe('AdjustmentList (US-20 / RN-15)', () => {
  it('renders the empty state when there are no adjustments', () => {
    renderList({ adjustments: [] });

    expect(
      screen.getByText('Todavía no hay descuentos registrados.'),
    ).toBeInTheDocument();
  });

  it('renders the discount amount with a Descuento badge', () => {
    renderList();

    expect(screen.getAllByText('Descuento').length).toBeGreaterThan(0);
    expect(screen.getByText('50,00 BOB')).toBeInTheDocument();
    expect(
      screen.getByText('Descuento por servicio incompleto'),
    ).toBeInTheDocument();
  });

  it('shows an "Anulado" chip and hides "Anular" for a fully voided discount', () => {
    const voided: SettlementAdjustmentSummary[] = [
      ...adjustments,
      {
        id: mockVoidAdjustment.id,
        type: 'VOID',
        amount: mockVoidAdjustment.amount,
        reason: mockVoidAdjustment.reason,
        createdAt: mockVoidAdjustment.createdAt,
      },
    ];

    renderList({ adjustments: voided });

    expect(screen.getByText('Anulación')).toBeInTheDocument();
    expect(screen.getByText('Anulado')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Anular$/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the "Anular" button only to WORKSHOP_LEAD and for active discounts (FE-18)', () => {
    const { onVoid } = renderList();

    const anular = screen.getByRole('button', { name: /^Anular$/ });
    anular.click();
    expect(onVoid).toHaveBeenCalledWith(adjustments[0]);
  });

  it('hides the "Anular" button for non-lead roles', () => {
    renderList({ canVoid: false });

    expect(
      screen.queryByRole('button', { name: /^Anular$/ }),
    ).not.toBeInTheDocument();
  });
});