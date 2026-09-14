import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { components } from '../../../shared/api/schema.gen';
import { server } from '../../../test/msw-handlers';
import { getVehicleHistory } from './vehicle-history-api';

type VehicleHistory = components['schemas']['VehicleHistoryResponseDto'];

const history: VehicleHistory = {
  id: 'vehicle-1',
  plate: 'AB-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2019,
  isFullyElectric: false,
  customerId: 'customer-1',
  customer: { id: 'customer-1', identification: '123456', name: 'Ana Perez', phone: null },
  technicalHistory: [],
  workOrders: [],
};

describe('getVehicleHistory', () => {
  it('calls the exact history endpoint with a normalized plate', async () => {
    server.use(
      http.get('/api/v1/vehicles/AB-123/history', () => HttpResponse.json(history)),
    );

    await expect(getVehicleHistory(' ab-123 ')).resolves.toEqual(history);
  });

  it('exposes a not-found ApiError for an unknown vehicle', async () => {
    server.use(
      http.get('/api/v1/vehicles/UNKNOWN/history', () => HttpResponse.json(
        { statusCode: 404, message: 'Vehicle not found', path: '/api/v1/vehicles/UNKNOWN/history' },
        { status: 404 },
      )),
    );

    await expect(getVehicleHistory('unknown')).rejects.toMatchObject({ statusCode: 404, message: 'Vehicle not found' });
  });
});
