import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { assignmentService } from '../../src/features/workshop/api/assignment-service';
import {
  assignmentServer,
  resetAssignmentData,
  SEED_MECHANICS,
  SEED_ORDERS,
} from './msw-assignment-handlers';

beforeAll(() => assignmentServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  assignmentServer.resetHandlers();
  resetAssignmentData();
});
afterAll(() => assignmentServer.close());

describe('assignment-service (HU-04)', () => {
  describe('getPendingAssignments', () => {
    it('returns only RECIBIDO work orders without an assigned mechanic (RN-14)', async () => {
      const result = await assignmentService.getPendingAssignments(1, 20);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: expect.any(String),
        plate: expect.any(String),
        vehicleBrand: expect.any(String),
        vehicleModel: expect.any(String),
        vehicleYear: expect.any(Number),
        customerName: expect.any(String),
        initialComplaint: expect.any(String),
        status: 'RECIBIDO',
        mechanicId: null,
      });
    });

    it('never exposes financial fields in the list (RN-16)', async () => {
      const result = await assignmentService.getPendingAssignments(1, 20);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('BOB');
      expect(serialized).not.toContain('totalPrice');
      expect(serialized).not.toContain('unitPrice');
      expect(serialized).not.toContain('subtotal');
    });
  });

  describe('getActiveMechanics', () => {
    it('returns only the active mechanics (RN-14)', async () => {
      const mechanics = await assignmentService.getActiveMechanics(1, 20);

      expect(mechanics).toHaveLength(2);
      expect(mechanics[0]).toMatchObject({ id: expect.any(String), isActive: true });
    });

    it('excludes the inactive mechanic from the assignment pool (RN-14)', async () => {
      const mechanics = await assignmentService.getActiveMechanics(1, 20);
      const ids = mechanics.map((mechanic) => mechanic.id);

      expect(ids).not.toContain(SEED_MECHANICS[2].id);
    });
  });

  describe('assignToMechanic', () => {
    it('posts { mechanicId } and returns the assignment result (HU-04)', async () => {
      const result = await assignmentService.assignToMechanic(
        SEED_ORDERS[0].id,
        SEED_MECHANICS[0].id,
      );

      expect(result).toMatchObject({
        id: SEED_ORDERS[0].id,
        mechanicId: SEED_MECHANICS[0].id,
        status: 'ASIGNADA',
      });
      expect(result.updatedAt).toBe('2026-08-12T10:00:00.000Z');
    });

    it('rejects with 422 when the mechanicId payload is invalid', async () => {
      await expect(
        assignmentService.assignToMechanic(SEED_ORDERS[0].id, ''),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('rejects with 404 when the work order no longer exists (RN-14)', async () => {
      await expect(
        assignmentService.assignToMechanic('unknown-work-order', SEED_MECHANICS[0].id),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects with 403 when the caller is not the Workshop Lead', async () => {
      const { http, HttpResponse } = await import('msw');
      assignmentServer.use(
        http.post('/api/v1/work-orders/:id/assign-mechanic', () =>
          HttpResponse.json(
            { statusCode: 403, message: 'Forbidden resource' },
            { status: 403 },
          ),
        ),
      );

      await expect(
        assignmentService.assignToMechanic(SEED_ORDERS[0].id, SEED_MECHANICS[0].id),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});