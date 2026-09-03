import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../src/test/msw-handlers';
import { createInventoryAdjustment } from '../../src/features/inventory/api/inventory-adjustments-api';

describe('US-14 inventory adjustments API', () => {
  it('sends the adjustment to the official endpoint with the expected payload', async () => {
    const requestSpy = vi.fn();

    server.use(
      http.post('/api/v1/inventory/adjustments', async ({ request }) => {
        requestSpy(await request.json());

        return HttpResponse.json(
          {
            success: true,
          },
          { status: 201 },
        );
      }),
    );

    const payload = {
      sparePartId: 'part-1',
      quantity: 3,
      type: 'BACKEND_TYPE',
      reason: 'Diferencia encontrada durante conteo físico',
    };

    await createInventoryAdjustment(payload);

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(payload);
  });
});