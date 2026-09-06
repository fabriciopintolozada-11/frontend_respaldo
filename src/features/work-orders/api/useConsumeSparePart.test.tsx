import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { server } from '../../../test/msw-handlers';
import {
  translateConsumePartError,
  useConsumeSparePart,
} from './useConsumeSparePart';
import { ApiError } from '../../../shared/api/httpClient';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const CONSUME_PATH = '/api/v1/work-orders/ot-123/consume-part';

describe('useConsumeSparePart', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the backend DTO and returns the installed response on success (HU-07)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(CONSUME_PATH, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json({
          id: 'qp-1',
          code: 'REP-FRE-001',
          name: 'Pastillas de Freno',
          quantity: 1,
          status: 'INSTALLED',
        });
      }),
    );

    const { result } = renderHook(() => useConsumeSparePart(), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      workOrderId: 'ot-123',
      quotePartId: 'qp-1',
      quantity: 1,
    });

    expect(bodySpy).toHaveBeenCalledWith({ quotePartId: 'qp-1', quantity: 1 });
    expect(response).toEqual({
      id: 'qp-1',
      code: 'REP-FRE-001',
      name: 'Pastillas de Freno',
      quantity: 1,
      status: 'INSTALLED',
    });
  });

  it('maps a 422 business-rule rejection to a contextual message', async () => {
    server.use(
      http.post(CONSUME_PATH, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'RN-07: spare part is not reserved for this work order' },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHook(() => useConsumeSparePart(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123', quotePartId: 'qp-1', quantity: 1 }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateConsumePartError(result.current.error);
    expect(details.isBusinessRuleError).toBe(true);
    expect(details.code).toBe(422);
    expect(details.message).toContain('RN-07');
  });

  it('maps a 422 insufficient-stock rejection and does not allow negative balances', async () => {
    server.use(
      http.post(CONSUME_PATH, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'RN-01: insufficient physical stock to consume the spare part' },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHook(() => useConsumeSparePart(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123', quotePartId: 'qp-1', quantity: 99 }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateConsumePartError(result.current.error);
    expect(details.isBusinessRuleError).toBe(true);
    expect(details.message).toContain('RN-01');
  });

  it('maps a 403 authorization rejection contextually (RN-04)', async () => {
    server.use(
      http.post(CONSUME_PATH, () =>
        HttpResponse.json(
          { statusCode: 403, message: 'Forbidden' },
          { status: 403 },
        ),
      ),
    );

    const { result } = renderHook(() => useConsumeSparePart(), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ workOrderId: 'ot-123', quotePartId: 'qp-1', quantity: 1 }),
    ).rejects.toBeTruthy();

    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateConsumePartError(result.current.error);
    expect(details.isAuthorizationError).toBe(true);
    expect(details.code).toBe(403);
    expect(details.message).toContain('RN-04');
  });

  it('does not surface a 401 as a business rule (auth required for a new session)', () => {
    const error = new ApiError(401, 'Unauthorized');
    const details = translateConsumePartError(error);
    expect(details.isAuthorizationError).toBe(true);
    expect(details.message).toMatch(/sesión/i);
  });
});
