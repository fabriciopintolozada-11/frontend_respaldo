import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkOrderTrackingCard } from './WorkOrderTrackingCard';
import type { components } from '../../../shared/api/schema.gen';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

const baseOrder: TrackingOrder = {
  id: 'ot-123',
  plate: 'ABC-123',
  model: 'Toyota Corolla',
  status: 'EN_REPARACION',
  entryDate: '2026-09-10T09:00:00.000Z',
  daysInWorkshop: 1,
  bayId: 'bay-1',
  bayNumber: 2,
  mechanicName: 'Juan Pérez',
  customerPhone: '70000000',
  missingPartName: null,
  pausedReason: null,
  daysWaitingApproval: null,
  isStaleQuote: false,
};

describe('WorkOrderTrackingCard (US-19 / FE-18)', () => {
  it('shows "Concluir Reparación" for WORKSHOP_LEAD when in EN_REPARACION (FE-18)', () => {
    render(
      <WorkOrderTrackingCard
        order={baseOrder}
        onViewHistory={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    ).toBeInTheDocument();
  });

  it('hides the action when onComplete is not provided (non WORKSHOP_LEAD)', () => {
    render(
      <WorkOrderTrackingCard order={baseOrder} onViewHistory={vi.fn()} />,
    );

    expect(
      screen.queryByRole('button', { name: /^Concluir Reparación$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Ver expediente histórico/i }),
    ).toBeInTheDocument();
  });

  it('hides the action when the order is not in EN_REPARACION (FE-18)', () => {
    render(
      <WorkOrderTrackingCard
        order={{ ...baseOrder, status: 'RECIBIDO' }}
        onViewHistory={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /^Concluir Reparación$/ }),
    ).not.toBeInTheDocument();
  });

  it('notifies the parent with the order id when clicked (FE-18)', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <WorkOrderTrackingCard
        order={baseOrder}
        onViewHistory={vi.fn()}
        onComplete={onComplete}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(onComplete).toHaveBeenCalledWith('ot-123');
  });
});