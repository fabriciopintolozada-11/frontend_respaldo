import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { mockPendingOrder } from '../mocks/additional-findings.fixtures';
import {
  PendingAdditionalFindingCard,
  type AdditionalFindingResolveContext,
} from './PendingAdditionalFindingCard';

describe('PendingAdditionalFindingCard (US-21 / FE-T21.1)', () => {
  it('highlights the pending additional finding with plate, description and customer contact', () => {
    render(
      <PendingAdditionalFindingCard
        order={mockPendingOrder}
        onResolve={vi.fn()}
        onViewHistory={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Ampliación de Presupuesto Pendiente/i),
    ).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(
      screen.getByText(/Fuga de aceite en el cárter detectada durante la reparación\./),
    ).toBeInTheDocument();
    expect(screen.getByText('+59170000000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Llamar$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^WhatsApp$/ })).toBeInTheDocument();
  });

  it('opens the resolve flow from both decision actions with the order context (FE-T21.2)', async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    render(
      <PendingAdditionalFindingCard
        order={mockPendingOrder}
        onResolve={onResolve}
        onViewHistory={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /Aprobar Ampliación/i }),
    );

    const expected: AdditionalFindingResolveContext = {
      id: mockPendingOrder.id,
      plate: mockPendingOrder.plate,
      findingDescription: mockPendingOrder.additionalFindingDescription ?? null,
    };
    expect(onResolve).toHaveBeenCalledWith(expected);
  });
});