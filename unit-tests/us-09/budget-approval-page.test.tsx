import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ToastProvider } from '../../src/shared/components/ToastContext';
import { BudgetApprovalPage } from '../../src/features/budget-approval/pages/BudgetApprovalPage';
import {
  PENDING_ORDER_ID,
  QUOTE_DETAIL,
  getRequestCounts,
  quoteServer,
  requestLog,
  resetQuoteApprovalData,
} from './msw-quote-approval-handlers';

beforeAll(() => quoteServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  quoteServer.resetHandlers();
  resetQuoteApprovalData();
});
afterAll(() => quoteServer.close());

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/presupuestos" element={<BudgetApprovalPage />} />
            <Route path="/presupuestos/:orderId" element={<BudgetApprovalPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>,
  );
}

describe('BudgetApprovalPage (US-09)', () => {
  it('lists pending budgets showing a readable order reference when orderCode is null', async () => {
    renderAt('/presupuestos');

    expect(await screen.findByText('Aprobación de presupuestos')).toBeInTheDocument();
    expect(await screen.findByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('María Pérez')).toBeInTheDocument();
    expect(screen.getByText(/OT · [0-9A-Z]{8}/)).toBeInTheDocument();
    expect(screen.getByText('980,00 BOB')).toBeInTheDocument();
  });

  it('renders the empty state when there are no pending quotes', async () => {
    quoteServer.use(
      http.get('/api/v1/budgets/approval', () =>
        HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 20 })),
    );

    renderAt('/presupuestos');

    expect(await screen.findByText('No hay presupuestos pendientes')).toBeInTheDocument();
  });

  it('renders the detail read-only (no IVA/descuento) with the real backend totals', async () => {
    renderAt(`/presupuestos/${PENDING_ORDER_ID}`);

    expect((await screen.findAllByText('Diagnóstico de frenos')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pastillas de freno').length).toBeGreaterThan(0);
    expect(screen.getByText('980,00 BOB')).toBeInTheDocument();
    expect(screen.queryByText(/IVA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revisar y aprobar/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /rechazar presupuesto/i })).toBeEnabled();
  });

  it('approves the whole quote, navigates back to the list and does not refetch the detail', async () => {
    const user = userEvent.setup();
    renderAt(`/presupuestos/${PENDING_ORDER_ID}`);

    await screen.findAllByText('Diagnóstico de frenos');
    const detailRequestsBefore = getRequestCounts().detail;

    await user.click(screen.getByRole('button', { name: /revisar y aprobar/i }));
    expect(await screen.findByText(/cliente autorizante/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/canal de comunicación/i), 'WHATSAPP');
    await user.type(screen.getByLabelText(/notas de respaldo/i), 'Cliente confirmó por WhatsApp.');
    await user.click(screen.getByRole('button', { name: /confirmar aprobación/i }));

    expect(await screen.findByText('Aprobación de presupuestos')).toBeInTheDocument();
    expect(await screen.findByText('Aprobación registrada')).toBeInTheDocument();
    expect(requestLog.approve).toEqual([
      { channel: 'WHATSAPP', customerName: 'María Pérez', notes: 'Cliente confirmó por WhatsApp.' },
    ]);
    expect(getRequestCounts().detail).toBe(detailRequestsBefore);
  });

  it('rejects the quote with the required reason and navigates back to the list', async () => {
    const user = userEvent.setup();
    renderAt(`/presupuestos/${PENDING_ORDER_ID}`);

    await screen.findAllByText('Diagnóstico de frenos');

    await user.click(screen.getByRole('button', { name: /rechazar presupuesto/i }));
    await user.type(screen.getByLabelText(/motivo obligatorio del rechazo/i), 'Costo fuera del presupuesto del cliente.');
    await user.click(screen.getByRole('button', { name: /confirmar rechazo/i }));

    expect(await screen.findByText('Aprobación de presupuestos')).toBeInTheDocument();
    expect(await screen.findByText('Rechazo registrado')).toBeInTheDocument();
    expect(requestLog.reject).toEqual([{ reason: 'Costo fuera del presupuesto del cliente.' }]);
  });

  it('disables the decision buttons when the quote is no longer pending', async () => {
    quoteServer.use(
      http.get('/api/v1/work-orders/work-orders/:id/budget-approval', () =>
        HttpResponse.json({
          ...QUOTE_DETAIL,
          workOrder: { ...QUOTE_DETAIL.workOrder, status: 'APROBADO' },
        })),
    );

    renderAt(`/presupuestos/${PENDING_ORDER_ID}`);

    await screen.findAllByText('Diagnóstico de frenos');

    expect(screen.getByRole('button', { name: /revisar y aprobar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /rechazar presupuesto/i })).toBeDisabled();
    expect(screen.getByText('Esta OT ya tiene una decisión registrada.')).toBeInTheDocument();
  });
});