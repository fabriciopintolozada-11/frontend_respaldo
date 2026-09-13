import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import type { components } from '../../../shared/api/schema.gen';
import { server } from '../../../test/msw-handlers';
import { AuthContext, type AuthContextValue } from '../../auth/providers/AuthProvider';
import type { AuthUser } from '../../auth/api/auth-service';
import { ToastProvider } from '../../../shared/components/ToastContext';
import { WorkOrderTrackingPage } from './WorkOrderTrackingPage';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];
type VehicleHistory = components['schemas']['VehicleHistoryResponseDto'];

const order: TrackingOrder = {
  id: 'order-1',
  plate: 'ABC123',
  model: 'Corolla',
  status: 'EN_REPARACION',
  entryDate: '2026-08-20T12:00:00.000Z',
  daysInWorkshop: 4,
  bayId: 'bay-1',
  bayNumber: 2,
  mechanicName: 'Mario Rojas',
  customerPhone: '+59170000000',
  missingPartName: null,
  pausedReason: null,
  daysWaitingApproval: null,
  isStaleQuote: false,
};

const history: VehicleHistory = {
  id: 'vehicle-1',
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2019,
  isFullyElectric: false,
  customerId: 'customer-1',
  customer: { id: 'customer-1', identification: '123456', name: 'Ana Perez', phone: null },
  technicalHistory: [{ id: 'technical-1', description: 'Cambio de aceite', createdAt: '2026-07-01T12:00:00.000Z' }],
  workOrders: [],
};

function renderPage(role: AuthUser['role'] = 'WORKSHOP_LEAD') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user: AuthUser = {
    id: 'usr-1',
    fullName: 'Test User',
    username: 'test',
    role,
  };
  const authValue: AuthContextValue = {
    user,
    accessToken: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(async () => user),
    logout: vi.fn(),
    refreshSession: vi.fn(async () => true),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/seguimiento']}>{children}</MemoryRouter>
        </QueryClientProvider>
      </ToastProvider>
    </AuthContext.Provider>
  );
  return render(<WorkOrderTrackingPage />, { wrapper });
}

describe('WorkOrderTrackingPage', () => {
  it('debounces the plate lookup and opens the vehicle history drawer', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([order])),
      http.get('/api/v1/vehicles/ABC123/history', () => HttpResponse.json(history)),
    );
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText(/placa del vehículo/i), 'ABC123');

    expect(await screen.findByText('1 orden encontrada')).toBeInTheDocument();
    expect(screen.getByText('Bahía 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ver expediente histórico/i }));

    await waitFor(() => expect(screen.getByRole('complementary', { name: /expediente histórico ABC123/i })).toBeInTheDocument());
    expect(await screen.findByText('Cambio de aceite')).toBeInTheDocument();
  });

  it('renders a clear empty state when the backend returns no active orders', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([])),
    );
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText(/placa del vehículo/i), 'ZZ9999');

    expect(await screen.findByText('Sin órdenes activas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /consultar expediente histórico/i })).toBeInTheDocument();
  });

  it('shows "Concluir Reparación" only to a WORKSHOP_LEAD on EN_REPARACION orders (US-19 / FE-18)', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([order])),
    );
    const user = userEvent.setup();

    renderPage('WORKSHOP_LEAD');
    await user.type(screen.getByLabelText(/placa del vehículo/i), 'ABC123');

    expect(
      await screen.findByRole('button', { name: /^Concluir Reparación$/ }),
    ).toBeInTheDocument();
  });

  it('hides "Concluir Reparación" for a non-lead role (US-19 / FE-18)', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([order])),
    );
    const user = userEvent.setup();

    renderPage('RECEPTIONIST');
    await user.type(screen.getByLabelText(/placa del vehículo/i), 'ABC123');

    expect(await screen.findByText('1 orden encontrada')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Concluir Reparación$/ }),
    ).not.toBeInTheDocument();
  });

  it('filters presupuestos estancados desde el backend al activar el filtro (US-16 / RN-06 / FE-T16.3)', async () => {
    const staleOrder: TrackingOrder = {
      ...order,
      status: 'PRESUPUESTO_ENVIADO',
      missingPartName: null,
      pausedReason: 'Awaiting customer approval',
      daysWaitingApproval: 17,
      isStaleQuote: true,
    };
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('onlyStaleQuotes') === 'true') {
          return HttpResponse.json([staleOrder]);
        }
        return HttpResponse.json([]);
      }),
    );
    const user = userEvent.setup();

    renderPage();
    await user.click(
      screen.getByRole('switch', { name: 'Solo estancados (≥15 días)' }),
    );

    expect(await screen.findByText('1 presupuesto estancado')).toBeInTheDocument();
    expect(screen.getByText('Alerta: 15+ días sin respuesta (17 días)')).toBeInTheDocument();
    expect(screen.getByText('17 días esperando aprobación del presupuesto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^WhatsApp$/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Llamar$/ })).toBeInTheDocument();
  });

  it('shows an empty state when there are no stale quotes (US-16)', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([])),
    );
    const user = userEvent.setup();

    renderPage();
    await user.click(
      screen.getByRole('switch', { name: 'Solo estancados (≥15 días)' }),
    );

    expect(await screen.findByText('No hay presupuestos estancados')).toBeInTheDocument();
  });

  it('renders the pending additional finding card and opens the resolve flow (US-21 / FE-T21.1)', async () => {
    const pendingOrder: TrackingOrder & {
      hasPendingAdditionalFinding: true;
      additionalFindingDescription: string | null;
    } = {
      ...order,
      hasPendingAdditionalFinding: true,
      additionalFindingDescription: 'Fuga de aceite detectada durante la reparación.',
    };
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json([pendingOrder]),
      ),
    );
    const user = userEvent.setup();

    renderPage();
    await user.type(screen.getByLabelText(/placa del vehículo/i), 'ABC123');

    expect(
      await screen.findByText(/Ampliación de Presupuesto Pendiente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fuga de aceite detectada durante la reparación\./),
    ).toBeInTheDocument();
    expect(screen.getByText('+59170000000')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Aprobar Ampliación/i }));

    expect(
      await screen.findByRole('dialog', { name: /Resolver ampliación de presupuesto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /Rechazar y continuar reparación base/i }),
    ).toBeInTheDocument();
  });
});
