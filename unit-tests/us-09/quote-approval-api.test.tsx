import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import {
  useBudgetApproval,
  useBudgetApprovalList,
  useSubmitBudgetApproval,
} from '../../src/features/budget-approval/api/useBudgetApproval';
import {
  PENDING_ORDER_ID,
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const approvePayload = {
  decision: 'APPROVED' as const,
  channel: 'WHATSAPP' as const,
  customerName: 'María Pérez',
  notes: 'Cliente confirmó por WhatsApp.',
};

const rejectPayload = {
  decision: 'REJECTED' as const,
  channel: 'CALL' as const,
  customerName: 'María Pérez',
  notes: '',
  reason: 'Costo fuera del presupuesto del cliente.',
};

describe('US-09 quote approval API contract', () => {
  it('loads the pending budget list from the real list contract', async () => {
    const { result } = renderHook(() => useBudgetApprovalList(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      expect.objectContaining({
        orderId: PENDING_ORDER_ID,
        orderCode: null,
        vehiclePlate: 'ABC-123',
        clientName: 'María Pérez',
        status: 'PRESUPUESTO_ENVIADO',
        totalBOB: '980.00',
      }),
    ]);
  });

  it('loads the approval detail using the backend double-prefix route', async () => {
    const { result } = renderHook(() => useBudgetApproval(PENDING_ORDER_ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.workOrder.vehiclePlate).toBe('ABC-123');
    expect(result.current.data?.workOrder.clientName).toBe('María Pérez');
    expect(result.current.data?.budget.total).toBe('980.00');
    expect(result.current.data?.budget.laborSubtotal).toBe('260.00');
    expect(result.current.data?.budget.partsSubtotal).toBe('720.00');
    expect(result.current.data?.items.some((item) => item.itemType === 'PART')).toBe(true);
  });

  it('approves the whole quote sending exactly {channel, customerName, notes} (whitelist-strict body)', async () => {
    const { result } = renderHook(() => useSubmitBudgetApproval(PENDING_ORDER_ID), { wrapper: createWrapper() });

    const response = await result.current.mutateAsync(approvePayload);

    expect(response.decision).toBe('APPROVED');
    expect(requestLog.approve).toEqual([
      { channel: 'WHATSAPP', customerName: 'María Pérez', notes: 'Cliente confirmó por WhatsApp.' },
    ]);
    expect(requestLog.reject).toHaveLength(0);
  });

  it('rejects the quote sending exactly {reason}', async () => {
    const { result } = renderHook(() => useSubmitBudgetApproval(PENDING_ORDER_ID), { wrapper: createWrapper() });

    const response = await result.current.mutateAsync(rejectPayload);

    expect(response.decision).toBe('REJECTED');
    expect(requestLog.reject).toEqual([
      { reason: 'Costo fuera del presupuesto del cliente.' },
    ]);
    expect(requestLog.approve).toHaveLength(0);
  });

  it('surfaces a 422 (insufficient stock, RN-07) instead of silently mocking', async () => {
    quoteServer.use(
      http.post('/api/v1/work-orders/:id/approve-quote', () =>
        HttpResponse.json(
          { statusCode: 422, message: 'Insufficient stock for part REP-FRE-001' },
          { status: 422 },
        )),
    );

    const { result } = renderHook(() => useSubmitBudgetApproval(PENDING_ORDER_ID), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync(approvePayload)).rejects.toThrow('Insufficient stock');
    expect(requestLog.approve).toHaveLength(0);
  });

  it('surfaces a 409 (quote already decided) instead of falling back to mock', async () => {
    quoteServer.use(
      http.post('/api/v1/work-orders/:id/reject-quote', () =>
        HttpResponse.json(
          { statusCode: 409, message: 'Quote decision is locked' },
          { status: 409 },
        )),
    );

    const { result } = renderHook(() => useSubmitBudgetApproval(PENDING_ORDER_ID), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync(rejectPayload)).rejects.toThrow('Quote decision is locked');
  });

  it('propagates 404 for orders without a pending quote', async () => {
    const { result } = renderHook(() => useBudgetApproval('not-an-order-id'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as { statusCode?: number }).statusCode).toBe(404);
  });
});