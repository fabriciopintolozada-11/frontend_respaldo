import { request } from '../../../shared/api/httpClient';

export interface SetAwaitingPartPayload {
  missingPartId: string;
  quantity: number;
  reason: string;
}

export interface AwaitingPartResponse {
  id: string;
  status: string;
  missingPartId: string;
  quantity: number;
  reason: string;
  createdAt: string;
}

export async function setWorkOrderAwaitingPart(
  workOrderId: string,
  payload: SetAwaitingPartPayload,
): Promise<AwaitingPartResponse> {
  return request<AwaitingPartResponse>({
    method: 'POST',
    url: `/work-orders/${workOrderId}/awaiting-part`,
    data: payload,
  });
}