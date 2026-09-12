import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../../../shared/api/schema.gen';
import { server } from '../../../test/msw-handlers';
import { getStaleQuoteOrders, getTrackingSummary } from './tracking-api';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

const trackingOrder: TrackingOrder = {
  id: 'order-1',
  plate: 'ABC123',
  model: 'Corolla',
  status: 'EN_ESPERA_DE_REPUESTO',
  entryDate: '2026-08-20T12:00:00.000Z',
  daysInWorkshop: 4,
  bayId: 'bay-1',
  bayNumber: 2,
  mechanicName: 'Mario Rojas',
  customerPhone: '+59170000000',
  missingPartName: 'Filtro de aceite',
  pausedReason: 'Stock agotado',
  daysWaitingApproval: null,
  isStaleQuote: false,
};

describe('getTrackingSummary', () => {
  it('normalizes the plate and sends the backend query parameter', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('licensePlate')).toBe('ABC123');
        return HttpResponse.json([trackingOrder]);
      }),
    );

    await expect(getTrackingSummary(' abc123 ')).resolves.toEqual([trackingOrder]);
  });

  it('preserves the backend error status and message', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json(
        {
          statusCode: 403,
          message: 'Forbidden',
          path: '/api/v1/work-orders/tracking-summary',
          timestamp: '2026-09-10T12:00:00.000Z',
        },
        { status: 403 },
      )),
    );

    await expect(getTrackingSummary('ABC123')).rejects.toMatchObject({ statusCode: 403, message: 'Forbidden' });
  });
});

describe('getStaleQuoteOrders (US-16 / RN-06)', () => {
  const staleOrder: TrackingOrder = {
    ...trackingOrder,
    status: 'PRESUPUESTO_ENVIADO',
    missingPartName: null,
    pausedReason: 'Awaiting customer approval',
    daysWaitingApproval: 17,
    isStaleQuote: true,
  };

  it('consulta el tracking summary con onlyStaleQuotes=true', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('onlyStaleQuotes')).toBe('true');
        return HttpResponse.json([staleOrder]);
      }),
    );

    await expect(getStaleQuoteOrders()).resolves.toEqual([staleOrder]);
  });

  it('ignora la placa: el endpoint devuelve todas las órdenes estancadas', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json([staleOrder])),
    );

    await expect(getStaleQuoteOrders()).resolves.toEqual([staleOrder]);
  });

  it('propaga los errores del backend', async () => {
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', () => HttpResponse.json(
        {
          statusCode: 500,
          message: 'Internal server error',
          path: '/api/v1/work-orders/tracking-summary',
          timestamp: '2026-09-10T12:00:00.000Z',
        },
        { status: 500 },
      )),
    );

    await expect(getStaleQuoteOrders()).rejects.toMatchObject({ statusCode: 500 });
  });
});
