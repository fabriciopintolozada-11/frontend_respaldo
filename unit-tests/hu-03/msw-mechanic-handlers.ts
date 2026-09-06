import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// HU-03 / RN-16: handlers mirror the real backend contract for the mechanic.
// The payloads deliberately contain no monetary fields.

const assignedList = {
  data: [
    {
      id: '11111111-1111-4111-8111-111111111101',
      vehicleId: 'v-1',
      plate: 'ABC-123',
      status: 'RECIBIDO',
      initialComplaint: 'Ruido en frenos delanteros',
      assignedAt: '2026-08-10T12:00:00.000Z',
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      vehicleId: 'v-2',
      plate: 'XYZ-987',
      status: 'EN_REPARACION',
      initialComplaint: 'Fuga de aceite en retén de bancada',
      assignedAt: '2026-08-11T09:30:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

const detailById = (id: string) => ({
  id,
  vehicleId: id === '11111111-1111-4111-8111-111111111101' ? 'v-1' : 'v-2',
  plate: id === '11111111-1111-4111-8111-111111111101' ? 'ABC-123' : 'XYZ-987',
  status: id === '11111111-1111-4111-8111-111111111101' ? 'RECIBIDO' : 'EN_REPARACION',
  initialComplaint:
    id === '11111111-1111-4111-8111-111111111101'
      ? 'Ruido en frenos delanteros'
      : 'Fuga de aceite en retén de bancada',
  assignedAt: '2026-08-10T12:00:00.000Z',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
  reservedParts:
    id === '11111111-1111-4111-8111-111111111102'
      ? [
          {
            quotePartId: 'qp-100',
            code: 'REP-RET-001',
            name: 'Kit retén trasero de cigüeñal',
            quantityReserved: 1,
            quantityUsed: 0,
            status: 'RESERVED',
          },
        ]
      : [],
});

export const mechanicsServer = setupServer(
  http.get('/api/v1/work-orders/assigned', () =>
    HttpResponse.json(assignedList),
  ),

  http.get('/api/v1/work-orders/assigned/:id', ({ params }) => {
    const id = String(params.id);
    const known = [
      '11111111-1111-4111-8111-111111111101',
      '11111111-1111-4111-8111-111111111102',
    ];
    if (!known.includes(id)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Assigned work order not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(detailById(id));
  }),

  http.post('/api/v1/work-orders/:id/consume-part', async ({ request, params }) => {
    const body = (await request.json()) as { quotePartId?: string; quantity?: number };
    if (!body.quotePartId || !body.quantity || body.quantity < 1) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Invalid payload' },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      { workOrderId: String(params.id), quotePartId: body.quotePartId, quantity: body.quantity },
      { status: 201 },
    );
  }),

  http.post('/api/v1/work-orders/:id/diagnostic', async ({ request, params }) => {
    const body = (await request.json()) as { description?: string };
    if (!body?.description?.trim()) {
      return HttpResponse.json(
        { statusCode: 400, message: 'description must not be empty' },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        id: 'dg-1',
        workOrderId: String(params.id),
        description: body.description,
        suggestedTasks: [],
        suggestedPartIds: [],
        estimatedHours: 0,
        createdAt: '2026-08-10T12:00:00.000Z',
      },
      { status: 201 },
    );
  }),
);