import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
});
