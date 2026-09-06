import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// US-09 / RN-07: mirrors the real backend contract for the quote approval flow.
// OrderCode is always null on the list; the double work-orders/work-orders
// prefix on the detail GET is the backend route and must not be "fixed".

export const PENDING_ORDER_ID = '11111111-1111-4111-8111-111111111101';

export const QUOTE_DETAIL = {
  quoteId: 'quote-1',
  workOrderId: PENDING_ORDER_ID,
  workOrder: {
    id: PENDING_ORDER_ID,
    status: 'PRESUPUESTO_ENVIADO',
    vehiclePlate: 'ABC-123',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleYear: 2019,
    clientName: 'María Pérez',
    clientDocument: '8765432 LP',
    clientPhone: '+591 70011122',
    entryReason: 'Revisión de frenos',
    createdAt: '2026-08-10T12:00:00.000Z',
  },
  budget: {
    id: 'quote-1',
    workOrderId: PENDING_ORDER_ID,
    total: '980.00',
    laborSubtotal: '260.00',
    partsSubtotal: '720.00',
    currency: 'BOB',
    status: 'PRESUPUESTO_ENVIADO',
    createdAt: '2026-08-10T12:05:00.000Z',
  },
  items: [
    {
      id: 'labor-1',
      description: 'Diagnóstico de frenos',
      itemType: 'LABOR',
      quantity: '2',
      unitPrice: '65.00',
      subtotal: '130.00',
      status: 'PROPOSED',
    },
    {
      id: 'part-1',
      description: 'Pastillas de freno',
      itemType: 'PART',
      quantity: '1',
      unitPrice: '390.00',
      subtotal: '390.00',
      status: 'PROPOSED',
      code: 'REP-FRE-001',
    },
  ],
  isFullyElectric: false,
};

export const LIST_RESPONSE = {
  data: [
    {
      orderId: PENDING_ORDER_ID,
      orderCode: null,
      vehiclePlate: 'ABC-123',
      vehicleDescription: 'Toyota Corolla (2019)',
      clientName: 'María Pérez',
      status: 'PRESUPUESTO_ENVIADO',
      totalBOB: '980.00',
      isFullyElectric: false,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const requestLog: { approve: Record<string, unknown>[]; reject: Record<string, unknown>[] } = {
  approve: [],
  reject: [],
};

let listRequests = 0;
let detailRequests = 0;

export function resetQuoteApprovalData(): void {
  requestLog.approve = [];
  requestLog.reject = [];
  listRequests = 0;
  detailRequests = 0;
}

export function getRequestCounts(): { list: number; detail: number } {
  return { list: listRequests, detail: detailRequests };
}

export const quoteServer = setupServer(
  http.get('/api/v1/budgets/approval', () => {
    listRequests += 1;
    return HttpResponse.json(LIST_RESPONSE);
  }),

  http.get('/api/v1/work-orders/work-orders/:id/budget-approval', ({ params }) => {
    if (String(params.id) !== PENDING_ORDER_ID) {
      return HttpResponse.json({ statusCode: 404, message: 'Quote not found' }, { status: 404 });
    }
    detailRequests += 1;
    return HttpResponse.json(QUOTE_DETAIL);
  }),

  http.post('/api/v1/work-orders/:id/approve-quote', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    requestLog.approve.push(body);
    return HttpResponse.json({
      id: 'decision-1',
      quoteId: 'quote-1',
      workOrderId: String(params.id),
      decision: 'APPROVED',
      channel: body.channel,
      customerName: body.customerName,
      notes: body.notes,
      createdAt: '2026-08-11T10:00:00.000Z',
    });
  }),

  http.post('/api/v1/work-orders/:id/reject-quote', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    requestLog.reject.push(body);
    return HttpResponse.json({
      id: 'decision-2',
      quoteId: 'quote-1',
      workOrderId: String(params.id),
      decision: 'REJECTED',
      reason: body.reason,
      createdAt: '2026-08-11T11:00:00.000Z',
    });
  }),
);