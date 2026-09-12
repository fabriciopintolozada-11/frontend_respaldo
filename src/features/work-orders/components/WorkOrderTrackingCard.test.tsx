import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { components } from '../../../shared/api/schema.gen';
import { WorkOrderTrackingCard } from './WorkOrderTrackingCard';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

const baseOrder: TrackingOrder = {
  id: 'order-list-1',
  plate: 'ABC1234',
  model: 'Corolla',
  status: 'LISTO_ENTREGA',
  entryDate: '2026-08-20T12:00:00.000Z',
  daysInWorkshop: 12,
  bayId: null,
  bayNumber: null,
  mechanicName: 'Mario Rojas',
  customerPhone: '+59170000000',
  missingPartName: null,
  pausedReason: null,
  daysWaitingApproval: null,
  isStaleQuote: false,
};

function renderCard(overrides: Partial<Parameters<typeof WorkOrderTrackingCard>[number]> = {}) {
  const base = {
    order: baseOrder,
    onViewHistory: vi.fn(),
    onSettle: vi.fn(),
  };
  const props = { ...base, ...overrides };
  render(<WorkOrderTrackingCard {...props} />);
  return props;
}

describe('WorkOrderTrackingCard entry point (US-20 / FE-18)', () => {
  it('shows "Liquidar Cuenta" only for orders in LISTO_ENTREGA when onSettle is provided', () => {
    renderCard();

    expect(
      screen.getByRole('button', { name: /^Liquidar Cuenta$/ }),
    ).toBeInTheDocument();
  });

  it('does not show the settle action for orders still in EN_REPARACION', () => {
    renderCard({ order: { ...baseOrder, status: 'EN_REPARACION' } });

    expect(
      screen.queryByRole('button', { name: /^Liquidar Cuenta$/ }),
    ).not.toBeInTheDocument();
  });

  it('does not show the settle action when onSettle is not provided (MECHANIC view)', () => {
    renderCard({ onSettle: undefined });

    expect(
      screen.queryByRole('button', { name: /^Liquidar Cuenta$/ }),
    ).not.toBeInTheDocument();
  });

  it('navigates with the order id when the settle action is clicked', async () => {
    const user = userEvent.setup();
    const { onSettle } = renderCard();

    await user.click(
      screen.getByRole('button', { name: /^Liquidar Cuenta$/ }),
    );

    expect(onSettle).toHaveBeenCalledWith('order-list-1');
  });
});