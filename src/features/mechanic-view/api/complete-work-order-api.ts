import { request } from '../../../shared/api/httpClient';

import type {
  CompleteWorkOrderPayload,
  CompleteWorkOrderResponse,
} from './complete-work-order.types';

// US-19 / FE-03: concludes a repair through the centralized HTTP client. The
// backend atomically sets the order to LISTO_ENTREGA, frees its bay, records
// the immutable technical history and notifies reception (BE-T19.3, RN-19).
export async function completeWorkOrderApi(
  workOrderId: string,
  payload: CompleteWorkOrderPayload,
): Promise<CompleteWorkOrderResponse> {
  return request<CompleteWorkOrderResponse>({
    method: 'POST',
    url: `/work-orders/${workOrderId}/complete`,
    data: payload,
  });
}