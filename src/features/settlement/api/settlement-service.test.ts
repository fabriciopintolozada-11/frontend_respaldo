import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '../../../test/msw-handlers';
import { settlementService } from './settlement-service';
import {
  mockAppliedDiscount,
  mockDeliverResponse,
  mockReadyOrder,
  mockSettlementResponse,
  mockVoidAdjustment,
} from '../mocks/settlement.fixtures';

describe('settlementService (US-20)', () => {
  it('getSettlement calls GET /work-orders/:id/settlement', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get('/api/v1/work-orders/:id/settlement', ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json(mockSettlementResponse);
      }),
    );

    const result = await settlementService.getSettlement('ot-1');

    expect(urlSpy).toHaveBeenCalled();
    expect(String(urlSpy.mock.calls[0][0])).toContain('/work-orders/ot-1/settlement');
    expect(result).toEqual(mockSettlementResponse);
  });

  it('listReadyToDeliver calls GET /work-orders/tracking-summary with status LISTO_ENTREGA', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get('/api/v1/work-orders/tracking-summary', ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json([mockReadyOrder]);
      }),
    );

    const result = await settlementService.listReadyToDeliver();

    const url = new URL(String(urlSpy.mock.calls[0][0]));
    expect(url.pathname).toContain('/work-orders/tracking-summary');
    expect(url.searchParams.get('status')).toBe('LISTO_ENTREGA');
    expect(result).toEqual([mockReadyOrder]);
  });

  it('applyDiscount posts the amount and reason to the apply-discount endpoint', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/work-orders/:id/settlement/apply-discount', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockAppliedDiscount);
      }),
    );

    const result = await settlementService.applyDiscount('ot-1', {
      amount: 50,
      reason: 'Descuento por servicio incompleto',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      amount: 50,
      reason: 'Descuento por servicio incompleto',
    });
    expect(result).toEqual(mockAppliedDiscount);
  });

  it('voidAdjustment posts the adjustmentId and reason to the void-adjustment endpoint', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/work-orders/:id/settlement/void-adjustment', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockVoidAdjustment);
      }),
    );

    const result = await settlementService.voidAdjustment('ot-1', {
      adjustmentId: 'adj-1',
      reason: 'Descuento aplicado por error, se revierte',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      adjustmentId: 'adj-1',
      reason: 'Descuento aplicado por error, se revierte',
    });
    expect(result).toEqual(mockVoidAdjustment);
  });

  it('deliver posts payment data to /work-orders/:id/deliver without monetary amounts (RN-21)', async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post('/api/v1/work-orders/:id/deliver', async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json(mockDeliverResponse);
      }),
    );

    const result = await settlementService.deliver('ot-1', {
      paymentMethod: 'CASH',
      receiptNumber: 'REC-001',
      deliveryNotes: 'Cliente satisfecho',
    });

    expect(bodySpy).toHaveBeenCalledWith({
      paymentMethod: 'CASH',
      receiptNumber: 'REC-001',
      deliveryNotes: 'Cliente satisfecho',
    });
    expect(result).toEqual(mockDeliverResponse);
  });
});