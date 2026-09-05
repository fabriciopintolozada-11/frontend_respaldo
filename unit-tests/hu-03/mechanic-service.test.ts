import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { mechanicService } from '../../src/features/mechanic-view/api/mechanic-service';
import { mechanicsServer } from './msw-mechanic-handlers';

beforeAll(() => mechanicsServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mechanicsServer.resetHandlers());
afterAll(() => mechanicsServer.close());

describe('mechanic-service (HU-03)', () => {
  describe('getAssigned', () => {
    it('returns only the orders assigned to the mechanic (RN-04)', async () => {
      const result = await mechanicService.getAssigned(1, 20);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: expect.any(String),
        plate: expect.any(String),
        status: expect.any(String),
        initialComplaint: expect.any(String),
      });
    });

    it('never exposes financial fields in the list (RN-16)', async () => {
      const result = await mechanicService.getAssigned(1, 20);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('BOB');
      expect(serialized).not.toContain('totalPrice');
      expect(serialized).not.toContain('unitPrice');
      expect(serialized).not.toContain('subtotal');
    });
  });

  describe('getAssignedDetail', () => {
    it('returns the technical detail with brand/model/year at the root', async () => {
      const detail = await mechanicService.getAssignedDetail(
        '11111111-1111-4111-8111-111111111102',
      );

      expect(detail.brand).toBe('Toyota');
      expect(detail.model).toBe('Corolla');
      expect(detail.year).toBe(2020);
      expect(detail.reservedParts[0]).toMatchObject({
        quotePartId: 'qp-100',
        code: 'REP-RET-001',
        quantityReserved: 1,
        status: 'RESERVED',
      });
    });

    it('never exposes financial fields in the detail (RN-16)', async () => {
      const detail = await mechanicService.getAssignedDetail(
        '11111111-1111-4111-8111-111111111102',
      );
      const serialized = JSON.stringify(detail);

      expect(serialized).not.toContain('BOB');
      expect(serialized).not.toContain('unitPrice');
      expect(serialized).not.toContain('subtotal');
      expect(serialized).not.toContain('totalPrice');
    });

    it('throws when the order is not assigned to the mechanic (RN-04)', async () => {
      await expect(
        mechanicService.getAssignedDetail('unknown-id'),
      ).rejects.toThrow();
    });
  });

  describe('consumePart (HU-07)', () => {
    it('posts the quotePartId and quantity to consume-part', async () => {
      await expect(
        mechanicService.consumePart(
          '11111111-1111-4111-8111-111111111102',
          'qp-100',
          1,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('createDiagnostic (US-11)', () => {
    it('posts the diagnostic payload', async () => {
      const result = await mechanicService.createDiagnostic(
        '11111111-1111-4111-8111-111111111101',
        {
          description: 'Pastillas delanteras desgastadas',
          suggestedTasks: ['Reemplazar pastillas'],
          suggestedPartIds: [],
          estimatedHours: 2,
        },
      );

      expect(result.workOrderId).toBe('11111111-1111-4111-8111-111111111101');
      expect(result.description).toBe('Pastillas delanteras desgastadas');
    });
  });
});