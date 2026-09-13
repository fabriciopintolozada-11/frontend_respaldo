import { useQuery } from '@tanstack/react-query';

import type { WorkOrder } from '../../../shared/types/openapi';
import { workOrdersService } from '../../work-orders/api/work-orders-service';

export interface MechanicOrdersResponse {
  success: boolean;
  data: WorkOrder[];
  timestamp: string;
}

export function useMechanicOrders() {
  return useQuery<MechanicOrdersResponse>({
    queryKey: ['work-orders', 'assigned'],
    queryFn: async () => {
      const response = await workOrdersService.getAssigned();
      return {
        success: response.success,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    },
    retry: false,
  });
}
