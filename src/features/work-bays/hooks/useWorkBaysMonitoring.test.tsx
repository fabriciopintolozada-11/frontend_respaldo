import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '../../../test/msw-handlers';
import type { WorkBayMonitoring } from '../api/types';
import { workBaysService } from '../api/work-bays-service';
import { useWorkBaysMonitoring } from './useWorkBaysMonitoring';

const MONITORING_PATH = '/api/v1/work-bays/monitoring';

function makeBay(bayNumber: number, status: WorkBayMonitoring['status']): WorkBayMonitoring {
  return {
    id: `bay-${bayNumber}`,
    bayNumber,
    isOccupied: status !== 'LIBRE',
    status,
    currentWorkOrderId: null,
    currentWorkOrder: null,
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-01T12:00:00.000Z',
  };
}

const monitoringResponse: WorkBayMonitoring[] = [
  makeBay(1, 'OCUPADA'),
  makeBay(2, 'ESPERA_REPUESTO'),
  makeBay(3, 'OCUPADA'),
  makeBay(4, 'LIBRE'),
];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('workBaysService.getMonitoring (FE-T18.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta GET /api/v1/work-bays/monitoring y devuelve las 4 bahías', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(MONITORING_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json(monitoringResponse);
      }),
    );

    const result = await workBaysService.getMonitoring();

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/work-bays/monitoring'));
    expect(result).toHaveLength(4);
    expect(result[0].bayNumber).toBe(1);
    expect(result[0].status).toBe('OCUPADA');
  });
});

describe('useWorkBaysMonitoring (FE-T18.3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('expone las 4 bahías del monitoreo a través de React Query', async () => {
    server.use(http.get(MONITORING_PATH, () => HttpResponse.json(monitoringResponse)));

    const { result } = renderHook(() => useWorkBaysMonitoring(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(4);
  });
});