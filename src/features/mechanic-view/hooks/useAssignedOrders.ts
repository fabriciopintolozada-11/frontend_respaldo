import { useQuery } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';
import type { AssignedWorkOrderDetail } from '../api/types';

export function useAssignedOrders() {
  return useQuery<AssignedWorkOrderDetail[]>({
    queryKey: ['mechanic', 'assigned-orders'],
    queryFn: async () => {
      const list = await mechanicService.getAssigned(1, 100);
      const details = await Promise.allSettled(
        list.data.map((o) => mechanicService.getAssignedDetail(o.id)),
      );
      return details
        .filter((r): r is PromiseFulfilledResult<AssignedWorkOrderDetail> =>
          r.status === 'fulfilled',
        )
        .map((r) => r.value);
    },
    staleTime: 30_000,
    retry: 1,
  });
}
