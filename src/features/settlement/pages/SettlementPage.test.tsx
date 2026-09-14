import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../../auth/api/auth-service';
import { AuthContext, type AuthContextValue } from '../../auth/providers/AuthProvider';
import { ToastProvider } from '../../../shared/components/ToastContext';
import { server } from '../../../test/msw-handlers';
import { SettlementPage } from './SettlementPage';
import {
  mockAppliedDiscount,
  mockDeliverResponse,
  mockSettlementResponse,
} from '../mocks/settlement.fixtures';

const ORDER_ID = mockSettlementResponse.workOrderId;
const SETTLEMENT_PATH = `/api/v1/work-orders/${ORDER_ID}/settlement`;

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
          <MemoryRouter initialEntries={[`/liquidacion/${ORDER_ID}`]}>
            <Routes>
              <Route path="/liquidacion" element={<div>INDEX_STUB</div>} />
              <Route path="/liquidacion/:orderId" element={<SettlementPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ToastProvider>
    </AuthContext.Provider>
  );
  render(<div />, { wrapper });
}

describe('SettlementPage (US-20)', () => {
  beforeEach(() => {
    server.use(
      http.get(SETTLEMENT_PATH, () => HttpResponse.json(mockSettlementResponse)),
    );
  });

  it('renders the settlement header, money cards and breakdown (FE-01)', async () => {
    renderPage();

    expect(
      await screen.findByText(mockSettlementResponse.plate),
    ).toBeInTheDocument();
    expect(screen.getByText(mockSettlementResponse.customerName)).toBeInTheDocument();
    expect(screen.getAllByText('Mano de obra').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Repuestos instalados').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1.141,00 BOB').length).toBeGreaterThan(0);
    expect(screen.getByText('Filtro de aceite')).toBeInTheDocument();
  });

  it('shows the settlement and void actions only to a WORKSHOP_LEAD (FE-18 / RN-15)', async () => {
    renderPage('WORKSHOP_LEAD');

    await screen.findByText(mockSettlementResponse.plate);
    expect(
      screen.getByRole('button', { name: /^Aplicar Descuento$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Anular$/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Entregar Vehículo$/ }),
    ).not.toBeInTheDocument();
  });

  it('shows the delivery action only to receptionist/admin and hides discount actions (RN-21)', async () => {
    renderPage('RECEPTIONIST');

    await screen.findByText(mockSettlementResponse.plate);
    expect(
      screen.getByRole('button', { name: /^Entregar Vehículo$/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Aplicar Descuento$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Anular$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Aplicar Descuento$/ }),
    ).not.toBeInTheDocument();
  });

  it('applies a discount and refreshes the settlement with a success toast', async () => {
    server.use(
      http.post(`${SETTLEMENT_PATH}/apply-discount`, () =>
        HttpResponse.json(mockAppliedDiscount, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('WORKSHOP_LEAD');

    await user.click(
      await screen.findByRole('button', { name: /^Aplicar Descuento$/ }),
    );

    const dialog = screen.getByRole('dialog', { name: /Aplicar descuento/i });
    await user.type(
      within(dialog).getByLabelText(/Monto del descuento \(BOB\)/i),
      '50.5',
    );
    await user.type(
      within(dialog).getByLabelText(/Motivo del descuento/i),
      'Descuento por servicio incompleto',
    );
    await user.click(
      within(dialog).getByRole('button', { name: /^Aplicar Descuento$/ }),
    );

    expect(await screen.findByText('Descuento aplicado')).toBeInTheDocument();
  });

  it('voids a discount through the confirmation modal (RN-15)', async () => {
    server.use(
      http.post(`${SETTLEMENT_PATH}/void-adjustment`, () =>
        HttpResponse.json({ id: 'void-1' }, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('WORKSHOP_LEAD');

    await user.click(
      await screen.findByRole('button', { name: /^Anular$/ }),
    );

    const dialog = screen.getByRole('dialog', { name: /Anular descuento/i });
    await user.type(
      within(dialog).getByLabelText(/Motivo de la anulación/i),
      'Descuento aplicado por error, se revierte',
    );
    await user.click(
      within(dialog).getByRole('button', { name: /^Confirmar Anulación$/ }),
    );

    expect(await screen.findByText('Descuento anulado')).toBeInTheDocument();
  });

  it('delivers the vehicle, shows the charged total toast and opens the note with delivery data (RN-21 / FE-T20.2)', async () => {
    server.use(
      http.post(`/api/v1/work-orders/${ORDER_ID}/deliver`, () =>
        HttpResponse.json(mockDeliverResponse, { status: 201 }),
      ),
    );
    const user = userEvent.setup();
    renderPage('RECEPTIONIST');

    await user.click(
      await screen.findByRole('button', { name: /^Entregar Vehículo$/ }),
    );

    const dialog = screen.getByRole('dialog', { name: /Entregar vehículo y cobrar/i });
    await user.type(
      within(dialog).getByLabelText(/Monto recibido \(BOB\)/i),
      '1200',
    );
    await user.type(
      within(dialog).getByLabelText(/Número de comprobante/i),
      'REC-001',
    );
    await user.click(
      within(dialog).getByRole('button', { name: /^Confirmar Entrega$/ }),
    );

    expect(
      await screen.findByText(/Cuenta cobrada por 1\.141,00/),
    ).toBeInTheDocument();

    const note = await screen.findByRole('dialog', {
      name: /Nota de Liquidación y Entrega/i,
    });
    expect(within(note).getByText('REC-001')).toBeInTheDocument();
    expect(within(note).getByText('Efectivo')).toBeInTheDocument();

    await user.click(
      within(note).getByRole('button', { name: /Volver a liquidaciones/i }),
    );
    expect(await screen.findByText('INDEX_STUB')).toBeInTheDocument();
  });

  it('opens the printable liquidation note for any settlement role (FE-T20.2)', async () => {
    window.print = vi.fn();
    const user = userEvent.setup();
    renderPage('WORKSHOP_LEAD');

    await user.click(
      await screen.findByRole('button', { name: /Imprimir Nota/i }),
    );

    const note = screen.getByRole('dialog', {
      name: /Nota de Liquidación y Entrega/i,
    });
    expect(
      within(note).getAllByText(/Documento sin valor fiscal/i).length,
    ).toBeGreaterThan(0);
    expect(within(note).getByText('Juan Pérez')).toBeInTheDocument();
    expect(within(note).getByText('Filtro de aceite')).toBeInTheDocument();
    expect(
      within(note).getByText(/Entrega pendiente de cobro/i),
    ).toBeInTheDocument();

    await user.click(
      within(note).getByRole('button', { name: /^Imprimir$/ }),
    );
    expect(window.print).toHaveBeenCalled();
  });

  it('maps a load failure to a translated error state (FE-04)', async () => {
    server.use(
      http.get(SETTLEMENT_PATH, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'continuation conflict' },
          { status: 409 },
        ),
      ),
    );
    renderPage();

    expect(await screen.findByText(/aún no está lista para entrega/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Volver a liquidaciones$/ }),
    ).toBeInTheDocument();
  });
});