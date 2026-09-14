import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/msw-handlers';
import type { PublicTrackingResponse } from './public-tracking.types';
import { usePublicTracking } from './usePublicTracking';

const SUCCESS_RESPONSE: PublicTrackingResponse = {
  workOrderNumber: 'ot-1',
  vehicleModel: 'CX-5',
  status: 'LISTO_ENTREGA',
  receivedAt: '2026-09-02T09:00:00.000Z',
  readyForPickup: true,
  tasksSummary: ['Cambio de aceite'],
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePublicTracking (US-17)', () => {
  it('maps plate/identification to licensePlate/nationalId in the request body', async () => {
    let sentBody: unknown;
    server.use(
      http.post('/api/v1/public-tracking', async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(SUCCESS_RESPONSE);
      }),
    );

    const { result } = renderHook(() => usePublicTracking(), { wrapper: makeWrapper() });

    result.current.mutate({ plate: '3210-BCD', identification: 'CI-1000001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(sentBody).toEqual({ licensePlate: '3210-BCD', nationalId: 'CI-1000001' });
    expect(result.current.data?.vehicleModel).toBe('CX-5');
  });

  it('exposes the PublicTrackingResponse on success (FE-21)', async () => {
    server.use(
      http.post('/api/v1/public-tracking', () => HttpResponse.json(SUCCESS_RESPONSE)),
    );

    const { result } = renderHook(() => usePublicTracking(), { wrapper: makeWrapper() });

    result.current.mutate({ plate: '3210-BCD', identification: 'CI-1000001' });

    await waitFor(() => expect(result.current.data?.readyForPickup).toBe(true));
    expect(result.current.data).toMatchObject({
      workOrderNumber: 'ot-1',
      status: 'LISTO_ENTREGA',
      tasksSummary: ['Cambio de aceite'],
    });
  });

  it('does not retry a 404 lookup (RN-17/privacidad)', async () => {
    let calls = 0;
    server.use(
      http.post('/api/v1/public-tracking', () => {
        calls += 1;
        return HttpResponse.json(
          { statusCode: 404, message: 'No valid work order found', path: '/api/v1/public-tracking' },
          { status: 404 },
        );
      }),
    );

    const { result } = renderHook(() => usePublicTracking(), { wrapper: makeWrapper() });

    result.current.mutate({ plate: 'ZZ9999', identification: 'CI-9999999' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(1);
    expect(result.current.error?.isNotFound).toBe(true);
  });

  it('does not retry a 429 rate-limited lookup (evita agravar throttling)', async () => {
    let calls = 0;
    server.use(
      http.post('/api/v1/public-tracking', () => {
        calls += 1;
        return HttpResponse.json(
          { statusCode: 429, message: 'ThrottlerException: Too Many Requests', path: '/api/v1/public-tracking' },
          { status: 429 },
        );
      }),
    );

    const { result } = renderHook(() => usePublicTracking(), { wrapper: makeWrapper() });

    result.current.mutate({ plate: 'THROTTLED', identification: 'CI-1000001' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(calls).toBe(1);
    expect(result.current.error?.statusCode).toBe(429);
  });
});