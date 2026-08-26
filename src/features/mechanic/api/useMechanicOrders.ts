import { useQuery } from '@tanstack/react-query';

import { ApiClientError } from '../../../shared/api/api-client';
import { ApiError } from '../../../shared/api/httpClient';
import { mockDb } from '../../../shared/api/mock-db';
import type { WorkOrder } from '../../../shared/types/openapi';
import { workOrdersService } from '../../work-orders/api/work-orders-service';

export interface MechanicOrdersResponse {
  success: boolean;
  data: WorkOrder[];
  timestamp: string;
}

export const mockMechanicOrders: WorkOrder[] = mockDb
  .getWorkOrders()
  .filter((order) => Boolean(order.primaryMechanicId));

function isNetworkOrTimeoutError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.errorCode === 'NETWORK_ERROR' || /network|timeout|timed out/i.test(error.message);
  }

  if (error instanceof ApiError) {
    return error.statusCode === 0 || error.statusCode === 408 || /network|timeout|timed out/i.test(error.message);
  }

  return error instanceof Error && /network|timeout|timed out|failed to fetch/i.test(error.message);
}

export function useMechanicOrders() {
  return useQuery<MechanicOrdersResponse>({
    queryKey: ['work-orders', 'assigned'],
    queryFn: async () => {
      try {
        return await workOrdersService.getAssigned();
      } catch (error) {
        if (!isNetworkOrTimeoutError(error)) throw error;

        return {
          success: true,
          data: mockMechanicOrders,
          timestamp: new Date().toISOString(),
        };
      }
    },
    retry: false,
  });
}
