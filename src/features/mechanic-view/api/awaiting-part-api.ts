import { request } from '../../../shared/api/httpClient';

export interface SetAwaitingPartPayload {
  missingPartId: string;
  quantity: number;
  reason: string;
}

export async function setWorkOrderAwaitingPart(
  workOrderId: string,
  payload: SetAwaitingPartPayload,
): Promise<void> {
  await request({
    method: 'POST',
    url: `/work-orders/${workOrderId}/awaiting-part`,
    data: payload,
  });
}