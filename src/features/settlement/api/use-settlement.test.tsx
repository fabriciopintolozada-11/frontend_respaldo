import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-handlers';
import { translateSettlementError } from './settlement.errors';
import {
  useApplyDiscount,
  useDeliver,
  useReadyToDeliverOrders,
  useSettlement,
  useVoidAdjustment,
} from './use-settlement';
import {
  mockAppliedDiscount,
  mockDeliverResponse,
  mockReadyOrder,
  mockSettlementResponse,
  mockVoidAdjustment,
} from '../mocks/settlement.fixtures';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const ORDER_ID = mockSettlementResponse.workOrderId;
const SETTLEMENT_PATH = `/api/v1/work-orders/${ORDER_ID}/settlement`;

describe('useSettlement (US-20)', () => {
  it('loads the settlement for the work order (FE-08)', async () => {
    server.use(
      http.get(`${SETTLEMENT_PATH}`, () => HttpResponse.json(mockSettlementResponse)),
    );

    const { result } = renderHook(() => useSettlement(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSettlementResponse);
  });

  it('does not fetch when the work order id is empty', () => {
    const { result } = renderHook(() => useSettlement(''), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('loads the ready-to-deliver list filtered by LISTO_ENTREGA', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () =>
        HttpResponse.json([mockReadyOrder]),
      ),
    );

    const { result } = renderHook(() => useReadyToDeliverOrders(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockReadyOrder]);
  });
});

describe('settlement mutations (US-20 / RN-15)', () => {
  it('applyDiscount posts the payload and invalidates the settlement query (FE-09)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(`${SETTLEMENT_PATH}/apply-discount`, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockAppliedDiscount);
      }),
    );
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useApplyDiscount(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      amount: 50,
      reason: 'Descuento por servicio incompleto',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      amount: 50,
      reason: 'Descuento por servicio incompleto',
    });
    expect(response).toEqual(mockAppliedDiscount);

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls
      .map((call) => call[0] as { queryKey: readonly unknown[] })
      .map((call) => call.queryKey[0]);
    expect(keys).toContain('settlement');
  });

  it('voidAdjustment posts the adjustment id and reason', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(`${SETTLEMENT_PATH}/void-adjustment`, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockVoidAdjustment);
      }),
    );

    const { result } = renderHook(() => useVoidAdjustment(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      adjustmentId: 'adj-1',
      reason: 'Descuento aplicado por error, se revierte',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      adjustmentId: 'adj-1',
      reason: 'Descuento aplicado por error, se revierte',
    });
    expect(response).toEqual(mockVoidAdjustment);
  });

  it('deliver posts payment data and invalidates settlement, tracking and work orders', async () => {
    server.use(
      http.post(`/api/v1/work-orders/${ORDER_ID}/deliver`, ({ request }) =>
        HttpResponse.json({ ...mockDeliverResponse, receiptNumber: new URL(request.url).search }),
      ),
    );
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useDeliver(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await result.current.mutateAsync({
      paymentMethod: 'CASH',
      receiptNumber: 'REC-001',
    });
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ status: 'ENTREGADO' }),
    );

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls
      .map((call) => call[0] as { queryKey: readonly unknown[] })
      .map((call) => call.queryKey[0]);
    expect(keys).toContain('settlement');
    expect(keys).toContain('work-order-tracking');
    expect(keys).toContain('work-orders');
  });

  it('maps a 422 to the available-total message (RN-15)', async () => {
    server.use(
      http.post(`${SETTLEMENT_PATH}/apply-discount`, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'RN-15: discount amount exceeds the available total' },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHook(() => useApplyDiscount(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ amount: 9999, reason: 'Descuento por servicio incompleto' }),
    ).rejects.toBeTruthy();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateSettlementError(result.current.error);
    expect(details.code).toBe(422);
    expect(details.message).toContain('total disponible');
  });

  it('maps a 403 to a role-restriction message (RN-15 / RN-16)', async () => {
    server.use(
      http.post(`${SETTLEMENT_PATH}/apply-discount`, () =>
        HttpResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 }),
      ),
    );

    const { result } = renderHook(() => useApplyDiscount(ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ amount: 50, reason: 'Descuento por servicio incompleto' }),
    ).rejects.toBeTruthy();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateSettlementError(result.current.error);
    expect(details.code).toBe(403);
    expect(details.message).toMatch(/rol no tiene permisos/);
  });
});