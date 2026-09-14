import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { server } from '../../../test/msw-handlers';
import { workOrdersService } from './work-orders-service';

const WORK_ORDERS_PATH = '/api/v1/work-orders';

const listItem = {
  id: 'ot-1',
  vehicleId: 'veh-1',
  plate: 'ABC123',
  vehicleBrand: 'Toyota',
  vehicleModel: 'Corolla',
  vehicleYear: 2019,
  customerName: 'María Pérez',
  customerIdentification: '1234567',
  initialComplaint: 'No acelera',
  status: 'PRESUPUESTO_ENVIADO',
  createdAt: '2026-08-01T00:00:00.000Z',
  mechanicId: null,
};

const listResponse = { data: [listItem], total: 1, page: 1, pageSize: 100 };

describe('workOrdersService.getAll (HU-01 / BE-24)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('consulta el listado paginado de órdenes de trabajo sin filtros extra', async () => {
    const urlSpy = vi.fn();
    server.use(
      http.get(WORK_ORDERS_PATH, ({ request }) => {
        urlSpy(request.url);
        return HttpResponse.json(listResponse);
      }),
    );

    const result = await workOrdersService.getAll();

    expect(urlSpy).toHaveBeenCalledWith(expect.stringContaining('/api/v1/work-orders?page=1&pageSize=100'));
    expect(urlSpy).toHaveBeenCalledWith(expect.not.stringContaining('onlyStaleQuotes'));
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      vehiclePlate: 'ABC123',
      status: 'PRESUPUESTO_ENVIADO',
      clientName: 'María Pérez',
    });
  });
});