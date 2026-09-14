import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../../shared/components/ToastContext';
import { server } from '../../../test/msw-handlers';
import { SettlementIndexPage } from './SettlementIndexPage';
import { mockReadyOrder } from '../mocks/settlement.fixtures';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/liquidacion']}>
          <Routes>
            <Route path="/liquidacion" element={<SettlementIndexPage />} />
            <Route
              path="/liquidacion/:orderId"
              element={<div>DETAIL_STUB</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>
  );
  render(<div />, { wrapper });
}

describe('SettlementIndexPage (US-20)', () => {
  it('lists the ready-to-deliver orders (LISTO_ENTREGA) with their plate', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json([mockReadyOrder]),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('Unidades listas para entrega'),
    ).toBeInTheDocument();
    expect(await screen.findByText('ABC1234')).toBeInTheDocument();
    expect(screen.getByText('1 orden lista')).toBeInTheDocument();
  });

  it('opens the settlement for an order through the "Liquidar Cuenta" action', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json([mockReadyOrder]),
      ),
    );
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /^Liquidar Cuenta$/ }),
    );
    expect(await screen.findByText('DETAIL_STUB')).toBeInTheDocument();
  });

  it('renders the empty state when nothing is ready for delivery', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json([]),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('No hay órdenes listas para entregar'),
    ).toBeInTheDocument();
  });

  it('shows a translated error state when the list cannot be loaded', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json(
          { statusCode: 500, message: 'boom' },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    expect(
      await screen.findByText(/No se pudo cargar la liquidación/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Reintentar$/ }),
    ).toBeInTheDocument();
  });
});