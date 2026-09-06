import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { MechanicWithName } from '../../src/features/workshop/api/types';
import type { WorkOrderListItem } from '../../src/shared/api/schema.gen';

// HU-04 / RN-14 + RN-16: mirrors the real backend contract for the Workshop
// Lead assignment flow. The payloads deliberately contain no financial fields.

export const SEED_ORDERS: WorkOrderListItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    vehicleId: 'v-1',
    plate: 'ABC-123',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleYear: 2020,
    customerName: 'Carlos Méndez',
    customerIdentification: '1234567',
    initialComplaint: 'Ruido en frenos delanteros',
    status: 'RECIBIDO',
    createdAt: '2026-08-10T12:00:00.000Z',
    mechanicId: null,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    vehicleId: 'v-2',
    plate: 'XYZ-987',
    vehicleBrand: 'Suzuki',
    vehicleModel: 'Swift',
    vehicleYear: 2019,
    customerName: 'Ana Quispe',
    customerIdentification: '7654321',
    initialComplaint: 'Fuga de aceite en retén de bancada',
    status: 'RECIBIDO',
    createdAt: '2026-08-11T09:30:00.000Z',
    mechanicId: null,
  },
];

export const SEED_MECHANICS: MechanicWithName[] = [
  { id: '22222222-2222-4222-8222-222222222201', isActive: true, name: 'Mecánico Uno' },
  { id: '22222222-2222-4222-8222-222222222202', isActive: true, name: 'Mecánico Dos' },
  // RN-14: inactive mechanics must never be offered for assignment.
  { id: '22222222-2222-4222-8222-222222222203', isActive: false, name: 'Mecánico Inactivo' },
];

let workOrders: WorkOrderListItem[] = SEED_ORDERS.map((order) => ({ ...order }));

export function resetAssignmentData(): void {
  workOrders = SEED_ORDERS.map((order) => ({ ...order }));
}

export const assignmentServer = setupServer(
  http.get('/api/v1/work-orders', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      data: workOrders.slice(start, start + pageSize),
      total: workOrders.length,
      page,
      pageSize,
    });
  }),

  http.get('/api/v1/mechanics', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      data: SEED_MECHANICS.slice(start, start + pageSize),
      total: SEED_MECHANICS.length,
      page,
      pageSize,
    });
  }),

  http.post('/api/v1/work-orders/:id/assign-mechanic', async ({ request, params }) => {
    const orderId = String(params.id);
    const body = (await request.json()) as { mechanicId?: string };

    if (!body.mechanicId) {
      return HttpResponse.json(
        { statusCode: 422, message: 'mechanicId must be a UUID' },
        { status: 422 },
      );
    }

    const order = workOrders.find((candidate) => candidate.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Work order not found' },
        { status: 404 },
      );
    }

    if (order.mechanicId) {
      return HttpResponse.json(
        { statusCode: 422, message: 'Work order is already assigned' },
        { status: 422 },
      );
    }

    workOrders = workOrders.filter((candidate) => candidate.id !== orderId);
    return HttpResponse.json(
      {
        id: orderId,
        mechanicId: body.mechanicId,
        status: 'ASIGNADA',
        updatedAt: '2026-08-12T10:00:00.000Z',
      },
      { status: 200 },
    );
  }),
);