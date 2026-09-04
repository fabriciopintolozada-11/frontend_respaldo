import { request } from '../../../shared/api/httpClient';

export interface CreateInventoryAdjustmentPayload {
  sparePartId: string;
  quantity: number;
  type: string;
  reason: string;
}

export async function createInventoryAdjustment(
  payload: CreateInventoryAdjustmentPayload,
): Promise<void> {
  await request({
    method: 'POST',
    url: '/inventory/adjustments',
    data: payload,
  });
}