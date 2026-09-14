import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '../../../test/msw-handlers';
import { publicTrackingService } from './public-tracking-service';

describe('publicTrackingService (US-17)', () => {
  it('posts licensePlate and nationalId to POST /public-tracking (RN-17)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/public-tracking', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json({
          workOrderNumber: 'ot-1',
          vehicleModel: 'CX-5',
          status: 'EN_REPARACION',
          receivedAt: '2026-09-02T09:00:00.000Z',
          readyForPickup: false,
          tasksSummary: ['Reemplazar kit de embrague'],
        });
      }),
    );

    const result = await publicTrackingService.track({
      licensePlate: '3210-BCD',
      nationalId: 'CI-1000001',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      licensePlate: '3210-BCD',
      nationalId: 'CI-1000001',
    });
    expect(result).toMatchObject({ workOrderNumber: 'ot-1', vehicleModel: 'CX-5' });
  });

  it('does not expose monetary or mechanic fields on success (RN-16)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/public-tracking', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json({
          workOrderNumber: 'ot-1',
          vehicleModel: 'CX-5',
          status: 'LISTO_ENTREGA',
          receivedAt: '2026-09-02T09:00:00.000Z',
          readyForPickup: true,
          tasksSummary: [],
        });
      }),
    );

    const result = await publicTrackingService.track({
      licensePlate: '3210-BCD',
      nationalId: 'CI-1000001',
    });

    expect('plate' in result).toBe(false);
    expect('mechanic' in result).toBe(false);
    expect('total' in result).toBe(false);
  });
});