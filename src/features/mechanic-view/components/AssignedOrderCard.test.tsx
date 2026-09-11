import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-handlers';
import { AssignedOrderCard } from './AssignedOrderCard';
import type { AssignedWorkOrderSummary } from '../api/types';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const summary: AssignedWorkOrderSummary = {
  id: 'ot-123',
  vehicleId: 'veh-1',
  plate: 'ABC-123',
  status: 'EN_REPARACION',
  initialComplaint: 'Ruido al frenar',
  assignedAt: '2026-09-10T09:00:00.000Z',
};

function mockDetail(status: string) {
  server.use(
    http.get('/api/v1/work-orders/assigned/ot-123', () =>
      HttpResponse.json({
        id: 'ot-123',
        vehicleId: 'veh-1',
        plate: 'ABC-123',
        status,
        initialComplaint: 'Ruido al frenar',
        assignedAt: '2026-09-10T09:00:00.000Z',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        tasks: [],
        parts: [],
        reservedParts: [],
        diagnosticReport: null,
        statusHistory: [],
      }),
    ),
  );
}

function renderCard() {
  return render(
    <AssignedOrderCard
      order={summary}
      onConsumePart={vi.fn()}
      onDiagnose={vi.fn()}
      onAwaitingPart={vi.fn().mockResolvedValue(undefined)}
      onComplete={vi.fn().mockResolvedValue(undefined)}
      isMutating={false}
    />,
    { wrapper: makeWrapper() },
  );
}

describe('AssignedOrderCard (US-19 / FE-18)', () => {
  it('shows "Concluir Reparación" only when the order is in EN_REPARACION (FE-18)', async () => {
    mockDetail('EN_REPARACION');
    renderCard();

    expect(
      await screen.findByRole('button', { name: /^Concluir Reparación$/ }),
    ).toBeInTheDocument();
  });

  it('hides the action when the order is not in EN_REPARACION (FE-18)', async () => {
    mockDetail('LISTO_ENTREGA');
    renderCard();

    await waitFor(() =>
      expect(screen.getByText('LISTO_ENTREGA')).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /^Concluir Reparación$/ }),
    ).not.toBeInTheDocument();
  });

  it('opens the closing modal with the order context when clicked (FE-18)', async () => {
    mockDetail('EN_REPARACION');
    renderCard();

    fireEvent.click(
      await screen.findByRole('button', { name: /^Concluir Reparación$/ }),
    );

    expect(
      screen.getByRole('dialog', { name: /Concluir reparación/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/OT-OT-123 · ABC-123/i)).toBeInTheDocument();
  });
});