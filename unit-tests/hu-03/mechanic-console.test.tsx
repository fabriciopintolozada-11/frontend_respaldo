import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';

import { ToastProvider } from '../../src/shared/components/ToastContext';
import { MechanicConsoleView } from '../../src/features/mechanic-view/pages/MechanicConsoleView';
import { mechanicsServer } from './msw-mechanic-handlers';

beforeAll(() => mechanicsServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mechanicsServer.resetHandlers());
afterAll(() => mechanicsServer.close());

function renderConsole() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MechanicConsoleView />
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>,
  );
}

describe('MechanicConsoleView (HU-03)', () => {
  it('renders only the mechanic assigned orders (RN-04)', async () => {
    renderConsole();

    expect(await screen.findByText('Consola de Mecánico')).toBeInTheDocument();
    expect(await screen.findByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('XYZ-987')).toBeInTheDocument();
    expect(screen.getByText('Órdenes asignadas (2)')).toBeInTheDocument();
  });

  it('shows the technical badge and never renders prices (RN-16)', async () => {
    renderConsole();

    expect(await screen.findByText(/vista técnica \(sin costos\)/i)).toBeInTheDocument();

    expect(screen.queryByText(/Bs\s/)).not.toBeInTheDocument();
    expect(screen.queryByText(/BOB/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$[0-9]/)).not.toBeInTheDocument();
  });

  it('renders the reserved parts detail (HU-07) without financial fields', async () => {
    renderConsole();

    expect(await screen.findByText('Kit retén trasero de cigüeñal')).toBeInTheDocument();
    expect(screen.getByText('REP-RET-001')).toBeInTheDocument();
    expect(screen.queryByText(/B[sS][ ]?/)).not.toBeInTheDocument();
  });

  it('does not render mock-only actions without a backend endpoint', async () => {
    renderConsole();

    await screen.findByText('ABC-123');

    expect(screen.queryByText('Reportar daño adicional')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Completar y enviar a control de calidad'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('En espera de repuesto')).not.toBeInTheDocument();
  });

  it('confirms a reserved part usage through consume-part (HU-07)', async () => {
    const user = userEvent.setup();
    renderConsole();

    await screen.findByText('Kit retén trasero de cigüeñal');
    await user.click(screen.getAllByRole('button', { name: /confirmar uso/i })[0]);

    expect(await screen.findByText('Repuesto instalado')).toBeInTheDocument();
  });

  it('shows the empty state when there are no assigned orders', async () => {
    const { http, HttpResponse } = await import('msw');
    mechanicsServer.use(
      http.get('/api/v1/work-orders/assigned', () =>
        HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 }),
      ),
    );

    renderConsole();

    expect(
      await screen.findByText('No hay órdenes asignadas actualmente'),
    ).toBeInTheDocument();
  });

  it('shows the error state with a retry action (FE-13)', async () => {
    const { http, HttpResponse } = await import('msw');
    mechanicsServer.use(
      http.get('/api/v1/work-orders/assigned', () =>
        HttpResponse.json(
          { statusCode: 500, message: 'Internal server error' },
          { status: 500 },
        ),
      ),
    );

    renderConsole();

    expect(
      await screen.findByText('No se pudieron cargar tus órdenes', undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});