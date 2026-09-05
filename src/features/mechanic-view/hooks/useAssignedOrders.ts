import { useQuery } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';
import type { AssignedWorkOrderDetail } from '../api/types';

// HU-03 / RN-04: lists only the work orders assigned to the authenticated
// mechanic. No per-order detail is fetched here to avoid a N+1 request.
export function useAssignedOrders() {
  return useQuery({
    queryKey: ['mechanic', 'assigned-orders'],
    queryFn: async () => {
      const response = await mechanicService.getAssigned(1, 20);
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

// HU-03 / FE-10: the technical detail (brand/model/year and reserved spare
// parts) is loaded on demand per card. The key includes the order id so React
// Query caches each detail independently.
export function useAssignedOrderDetail(orderId: string | null) {
  return useQuery<AssignedWorkOrderDetail>({
    queryKey: ['mechanic', 'assigned-order', orderId],
    queryFn: () => mechanicService.getAssignedDetail(orderId as string),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    retry: 1,
  });
}