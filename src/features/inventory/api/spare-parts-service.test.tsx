import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '../../../test/msw-handlers';
import { ApiError } from '../../../shared/api/httpClient';
import {
  createSparePart,
  deactivateSparePart,
  listSpareParts,
  registerAdjustment,
  useSpareParts,
} from './spare-parts-service';
import type {
  CreateSparePartRequest,
  CreateInventoryAdjustmentRequest,
  SparePart,
  SparePartListResponse,
} from '../spare-parts.types';

const SPARE_PARTS_PATH = '/api/v1/spare-parts';

const part: SparePart = {
  id: 'part-1',
  code: 'REP-MOT-001',
  name: 'Bujía NGK BPR6ES',
  category: 'MOTOR',
  unitPrice: '45.00',
  physicalStock: 10,
  availableStock: 8,
  reservedStock: 2,
  lastMovementAt: '2026-08-01T00:00:00.000Z',
  isActive: true,
};

const adjustedSnapshot: SparePart = {
  ...part,
  physicalStock: 13,
  availableStock: 11,
  lastMovementAt: '2026-09-01T00:00:00.000Z',
};

const listResponse: SparePartListResponse = {
  data: [part],
  total: 1,
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

describe('spare-parts-service (US-23)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries the catalog with search, category, page and pageSize (BE-24)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(SPARE_PARTS_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json(listResponse);
      }),
    );

    const result = await listSpareParts({
      search: 'bujia',
      category: 'MOTOR',
      page: 2,
      pageSize: 10,
    });

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('search=bujia'));
    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('category=MOTOR'));
    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('pageSize=10'));
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].unitPrice).toBe('45.00');
  });

  it('returns the items through useSpareParts (FE-08, FE-23.3)', async () => {
    server.use(http.get(SPARE_PARTS_PATH, () => HttpResponse.json(listResponse)));

    const { result } = renderHook(() => useSpareParts({ page: 1, pageSize: 20 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([part]);
  });

  it('translates a 403 forbidden response into ApiError (FE-04)', async () => {
    server.use(
      http.get(SPARE_PARTS_PATH, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Insufficient role for this operation' },
          { status: 403 },
        ),
      ),
    );

    const { result } = renderHook(() => useSpareParts({ page: 1, pageSize: 20 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).statusCode).toBe(403);
  });

  it('creates a spare part posting the documented payload (BE-T23.6)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.post(SPARE_PARTS_PATH, async ({ request }) => {
        urlSpy(request.url);
        const body = (await request.json()) as CreateSparePartRequest;
        expect(body).toEqual({
          code: 'REP-ELC-004',
          name: 'Bujía nueva',
          category: 'ELECTRICO_LUCES',
          unitPrice: 45,
          initialStock: 20,
        });
        return HttpResponse.json(part, { status: 201 });
      }),
    );

    const created = await createSparePart({
      code: 'REP-ELC-004',
      name: 'Bujía nueva',
      category: 'ELECTRICO_LUCES',
      unitPrice: 45,
      initialStock: 20,
    });

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/spare-parts'));
    expect(created.id).toBe('part-1');
  });

  it('rejects creation for unauthorized roles with 403 (US-23, RN-16)', async () => {
    server.use(
      http.post(SPARE_PARTS_PATH, () =>
        HttpResponse.json({ statusCode: 403, message: 'Forbidden resource' }, { status: 403 }),
      ),
    );

    await expect(
      createSparePart({ code: 'X', name: 'Y', category: 'MOTOR', unitPrice: 1, initialStock: 0 }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deactivates a spare part through the deactivate action (BE-T23.6)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.post(`${SPARE_PARTS_PATH}/part-1/deactivate`, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json({ ...part, isActive: false });
      }),
    );

    const result = await deactivateSparePart('part-1');

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/spare-parts/part-1/deactivate'));
    expect(result.isActive).toBe(false);
  });

  it('registers an adjustment and returns the updated spare part snapshot (US-14 contract)', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.post(`${SPARE_PARTS_PATH}/adjustments`, async ({ request }) => {
        urlSpy(request.url);
        const body = (await request.json()) as CreateInventoryAdjustmentRequest;
        expect(body).toEqual({
          sparePartId: 'part-1',
          quantity: 3,
          type: 'POSITIVE',
          reason: 'Conteo físico detectó unidades adicionales.',
        });
        return HttpResponse.json(adjustedSnapshot, { status: 201 });
      }),
    );

    const result = await registerAdjustment({
      sparePartId: 'part-1',
      quantity: 3,
      type: 'POSITIVE',
      reason: 'Conteo físico detectó unidades adicionales.',
    });

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/spare-parts/adjustments'));
    expect(result.physicalStock).toBe(13);
    expect(result.availableStock).toBe(11);
  });
});