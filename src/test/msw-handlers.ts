import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';

import type { components } from '../shared/api/schema.gen';
import type { PublicTrackingResponse } from '../features/tracking-public/api/public-tracking.types';

export type VehicleStatusResponse = components['schemas']['VehicleStatusResponseDto'];

const notFoundBody = {
  statusCode: 404,
  message: 'No valid work order found for the provided data',
  path: '/api/v1/public/vehicle-status',
  timestamp: '2026-08-19T00:00:00.000Z',
};

export function statusResponse(overrides: Partial<VehicleStatusResponse> = {}): VehicleStatusResponse {
  return {
    workOrderId: 'work-order-1',
    plate: 'ABC123',
    vehicle: { brand: 'Toyota', model: 'Corolla', year: 2019 },
    createdAt: '2026-08-10T12:00:00.000Z',
    status: 'EN_REPARACION',
    stage: 'En reparación',
    readyForPickup: false,
    ...overrides,
  };
}

// US-17: contrato real de POST /api/v1/public-tracking.
export function publicTrackingResponse(overrides: Partial<PublicTrackingResponse> = {}): PublicTrackingResponse {
  return {
    workOrderNumber: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    vehicleModel: 'CX-5',
    status: 'EN_REPARACION',
    receivedAt: '2026-09-02T09:00:00.000Z',
    readyForPickup: false,
    tasksSummary: ['Reemplazar kit de embrague', 'Drenar y rellenar aceite de transmisión'],
    ...overrides,
  };
}

export const handlers = [
  // Legacy US-02 endpoint (used by work-orders-service). Kept untouched.
  http.get('/api/v1/public/vehicle-status', async ({ request }) => {
    const url = new URL(request.url);
    const plate = url.searchParams.get('plate');

    if (plate === 'SLOW') {
      await delay(600);
      return HttpResponse.json(statusResponse());
    }

    if (plate === 'ZZ9999') {
      return HttpResponse.json(notFoundBody, { status: 404 });
    }

    if (plate === 'ERROR500') {
      return HttpResponse.json(
        { statusCode: 500, message: 'Internal server error', path: '/api/v1/public/vehicle-status' },
        { status: 500 },
      );
    }

    if (plate === 'FINISHED') {
      return HttpResponse.json(
        statusResponse({ status: 'FINALIZADO', stage: 'Finalizado', readyForPickup: true }),
      );
    }

    if (plate === 'EX0001') {
      return HttpResponse.json(
        statusResponse({ plate: 'EX0001', status: 'ASIGNADA', stage: 'ASIGNADA' }),
      );
    }

    return HttpResponse.json(statusResponse());
  }),

  // US-17 public tracking endpoint.
  http.post('/api/v1/public-tracking', async ({ request }) => {
    const body = (await request.json()) as { licensePlate?: string };
    const plate = body.licensePlate;

    if (plate === 'SLOW') {
      await delay(600);
      return HttpResponse.json(publicTrackingResponse());
    }

    if (plate === 'ZZ9999' || plate === 'NOTFOUND') {
      return HttpResponse.json(
        {
          statusCode: 404,
          message: 'No se encontró ninguna orden de trabajo activa asociada a los datos ingresados',
          path: '/api/v1/public-tracking',
        },
        { status: 404 },
      );
    }

    if (plate === 'THROTTLED') {
      return HttpResponse.json(
        { statusCode: 429, message: 'ThrottlerException: Too Many Requests', path: '/api/v1/public-tracking' },
        { status: 429 },
      );
    }

    if (plate === 'ERROR500') {
      return HttpResponse.json(
        { statusCode: 500, message: 'Internal server error', path: '/api/v1/public-tracking' },
        { status: 500 },
      );
    }

    if (plate === 'FINISHED') {
      return HttpResponse.json(
        publicTrackingResponse({ status: 'LISTO_ENTREGA', readyForPickup: true }),
      );
    }

    if (plate === 'EARLY') {
      return HttpResponse.json(
        publicTrackingResponse({ vehicleModel: 'Ranger', status: 'RECIBIDO', tasksSummary: [] }),
      );
    }

    return HttpResponse.json(publicTrackingResponse());
  }),
];

export const server = setupServer(...handlers);
