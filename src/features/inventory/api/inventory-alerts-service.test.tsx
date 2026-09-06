import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '../../../test/msw-handlers';
import { ApiError } from '../../../shared/api/httpClient';
import { listInventoryAlerts, useInventoryAlerts } from './inventory-alerts-service';
import type { InventoryAlertsListResponse } from '../inventory-alerts.types';

const ALERTS_PATH = '/api/v1/inventory/alerts';

const alertsResponse: InventoryAlertsListResponse = {
  data: [
    {
      partId: 'part-1',
      code: 'REP-MOT-001',
      name: 'Bujía NGK BPR6ES',
      category: 'MOTOR',
      physicalStock: 5,
      reservedStock: 0,
      availableStock: 5,
      daysWithoutMovement: 75,
      alertType: 'NO_ROTATION',
      lastMovementAt: '2026-06-10T00:00:00.000Z',
    },
    {
      partId: 'part-2',
      code: 'REP-FRE-002',
      name: 'Pastillas de Freno',
      category: 'FRENOS',
      physicalStock: 2,
      reservedStock: 4,
      availableStock: -2,
      daysWithoutMovement: 3,
      alertType: 'STOCK_OUT',
      lastMovementAt: null,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('inventory-alerts-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the alerts endpoint with the given query params (US-08, RN-10)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(ALERTS_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json(alertsResponse);
      }),
    );

    const result = await listInventoryAlerts({ alertType: 'NO_ROTATION', page: 2, pageSize: 10 });

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('alertType=NO_ROTATION'));
    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('pageSize=10'));
    expect(result.total).toBe(2);
    expect(result.data[0].partId).toBe('part-1');
  });

  it('caches the list with a 5-minute staleTime through useInventoryAlerts (FE-T08.2)', async () => {
    server.use(http.get(ALERTS_PATH, () => HttpResponse.json(alertsResponse)));

    const { result } = renderHook(() => useInventoryAlerts({ page: 1, pageSize: 20 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('translates a 403 forbidden response for non-authorized roles (US-08, FE-04)', async () => {
    server.use(
      http.get(ALERTS_PATH, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Insufficient role for this operation' },
          { status: 403 },
        ),
      ),
    );

    const { result } = renderHook(() => useInventoryAlerts({ page: 1, pageSize: 20 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).statusCode).toBe(403);
  });
});