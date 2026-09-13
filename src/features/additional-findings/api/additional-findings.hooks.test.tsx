import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/msw-handlers';
import {
  ADDITIONAL_FINDING_ORDER_ID,
  mockApprovedAdditionalFinding,
  mockRejectedAdditionalFinding,
} from '../mocks/additional-findings.fixtures';
import { translateAdditionalFindingError } from './additional-findings.errors';
import {
  useApproveAdditionalFinding,
  useRejectAdditionalFinding,
} from './additional-findings.hooks';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const APPROVE_PATH = `/api/v1/work-orders/${ADDITIONAL_FINDING_ORDER_ID}/additional-findings/approve`;
const REJECT_PATH = `/api/v1/work-orders/${ADDITIONAL_FINDING_ORDER_ID}/additional-findings/reject`;

describe('useApproveAdditionalFinding (US-21 / FE-09)', () => {
  it('posts the approval payload and invalidates tracking and mechanic queries', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(APPROVE_PATH, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockApprovedAdditionalFinding);
      }),
    );
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useApproveAdditionalFinding(ADDITIONAL_FINDING_ORDER_ID), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      channel: 'CALL',
      customerName: 'Juan Pérez',
      notes: 'Cliente confirmó la ampliación por teléfono.',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      channel: 'CALL',
      customerName: 'Juan Pérez',
      notes: 'Cliente confirmó la ampliación por teléfono.',
    });
    expect(response).toEqual(mockApprovedAdditionalFinding);

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls
      .map((call) => call[0] as { queryKey: readonly unknown[] })
      .map((call) => call.queryKey[0]);
    expect(keys).toContain('work-order-tracking');
    expect(keys).toContain('mechanic');
  });

  it('maps a 409 to the already-decided message', async () => {
    server.use(
      http.post(APPROVE_PATH, () =>
        HttpResponse.json(
          { statusCode: 409, message: 'Work order is not awaiting an additional budget approval' },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHook(() => useApproveAdditionalFinding(ADDITIONAL_FINDING_ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        channel: 'WHATSAPP',
        customerName: 'Juan Pérez',
        notes: 'Confirmación resolutiva.',
      }),
    ).rejects.toBeTruthy();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateAdditionalFindingError(result.current.error);
    expect(details.code).toBe(409);
    expect(details.message).toMatch(/ya fue decidida/i);
  });
});

describe('useRejectAdditionalFinding (US-21 / FE-09)', () => {
  it('posts the reason and invalidates the same queries', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post(REJECT_PATH, async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockRejectedAdditionalFinding);
      }),
    );
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    const { result } = renderHook(() => useRejectAdditionalFinding(ADDITIONAL_FINDING_ORDER_ID), {
      wrapper: makeWrapper(),
    });

    const response = await result.current.mutateAsync({
      reason: 'El cliente prefiere reparar la falla en otro taller.',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      reason: 'El cliente prefiere reparar la falla en otro taller.',
    });
    expect(response).toEqual(mockRejectedAdditionalFinding);

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    const keys = invalidateSpy.mock.calls
      .map((call) => call[0] as { queryKey: readonly unknown[] })
      .map((call) => call.queryKey[0]);
    expect(keys).toContain('work-order-tracking');
    expect(keys).toContain('mechanic');
  });

  it('maps a 422 to the stock-insufficient message (RN-07)', async () => {
    server.use(
      http.post(REJECT_PATH, () =>
        HttpResponse.json(
          { statusCode: 422, message: 'Insufficient available stock for a suggested spare part' },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHook(() => useRejectAdditionalFinding(ADDITIONAL_FINDING_ORDER_ID), {
      wrapper: makeWrapper(),
    });

    await expect(
      result.current.mutateAsync({ reason: 'Cliente declinó la ampliación.' }),
    ).rejects.toBeTruthy();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    const details = translateAdditionalFindingError(result.current.error);
    expect(details.code).toBe(422);
    expect(details.message).toMatch(/stock/);
  });
});