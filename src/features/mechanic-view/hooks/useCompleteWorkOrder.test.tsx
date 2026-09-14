import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-handlers';
import { useCompleteWorkOrder } from './useCompleteWorkOrder';
import { translateCompleteError } from '../api/complete-work-order.error';
import { ApiError } from '../../../shared/api/httpClient';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const COMPLETE_PATH = '/api/v1/work-orders/ot-123/complete';

describe('useCompleteWorkOrder (US-19)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the closing payload to POST /complete and returns the response (US-19)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(COMPLETE_PATH, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json({
          id: 'ot-123',
          status: 'LISTO_ENTREGA',
          completedAt: '2026-09-11T15:00:00.000Z',
          bayNumber: 2,
          finalMileage: 125400,
          closingNotes: 'Radiador reemplazado y probado en ruta',
        });
      }),
    );

    const { result } = renderHook(() => useCompleteWorkOrder(), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      workOrderId: 'ot-123',
      finalMileage: 125400,
      closingNotes: 'Radiador reemplazado y probado en ruta',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      finalMileage: 125400,
      closingNotes: 'Radiador reemplazado y probado en ruta',
    });
    expect(response).toMatchObject({
      id: 'ot-123',
      status: 'LISTO_ENTREGA',
      bayNumber: 2,
      finalMileage: 125400,
    });
  });

  it('invalidates the mechanic, bays and tracking queries after a success (FE-09)', async () => {
    server.use(
      http.post(COMPLETE_PATH, () =>
        HttpResponse.json({
          id: 'ot-123',
          status: 'LISTO_ENTREGA',
          completedAt: '2026-09-11T15:00:00.000Z',
          bayNumber: null,
          finalMileage: null,
          closingNotes: null,
        }),
      ),
    );

    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useCompleteWorkOrder(), {
      wrapper: makeWrapper(),
    });

    await result.current.mutateAsync({ workOrderId: 'ot-123' });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalled();
    });

    const keys = invalidateSpy.mock.calls
      .map((call) => call[0] as { queryKey: readonly unknown[] })
      .map((c) => c.queryKey[0]);
    expect(keys).toContain('mechanic');
    expect(keys).toContain('work-bays');
    expect(keys).toContain('work-order-tracking');
  });

  it('maps a 403 rejection to the ownership message (RN-04)', async () => {
    server.use(
      http.post(COMPLETE_PATH, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Forbidden' },
          { status: 403 },
        ),
      ),
    );

    const { result } = renderHook(() => useCompleteWorkOrder(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123' }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateCompleteError(result.current.error);
    expect(details.code).toBe(403);
    expect(details.message).toContain('mecánico asignado');
  });

  it('maps a 422 rejection to the Gherkin awaiting-parts message (RN-05)', async () => {
    server.use(
      http.post(COMPLETE_PATH, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'RN-05: work order is awaiting spare parts and cannot be concluded' },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHook(() => useCompleteWorkOrder(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123' }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateCompleteError(result.current.error);
    expect(details.code).toBe(422);
    expect(details.message).toContain('repuestos pendientes de llegada');
  });

  it('maps a 409 rejection contextually (order not in EN_REPARACION)', async () => {
    server.use(
      http.post(COMPLETE_PATH, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'Work order must be in EN_REPARACION' },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useCompleteWorkOrder(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123' }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateCompleteError(result.current.error);
    expect(details.code).toBe(409);
    expect(details.message).toContain('En Reparación');
  });

  it('does not surface a 401 as a business rule (auth required for a new session)', () => {
    const error = new ApiError(401, 'Unauthorized');
    const details = translateCompleteError(error);
    expect(details.code).toBe(401);
    expect(details.message).toMatch(/sesión/i);
  });
});