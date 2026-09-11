import { useMutation, useQueryClient } from '@tanstack/react-query';

import { completeWorkOrderApi } from '../api/complete-work-order-api';
import type {
  CompleteWorkOrderPayload,
  CompleteWorkOrderResponse,
} from '../api/complete-work-order.types';

export interface CompleteWorkOrderVariables extends CompleteWorkOrderPayload {
  workOrderId: string;
}

// US-19 / FE-09: mutation to conclude a repair. After a successful conclusion
// the dependent queries are invalidated (FE-09): the mechanic assigned list
// and per-order detail (the order leaves EN_REPARACION), the bays monitoring
// (the bay was freed, RN-14) and the tracking summary (the order is now
// LISTO_ENTREGA).
export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation<
    CompleteWorkOrderResponse,
    unknown,
    CompleteWorkOrderVariables
  >({
    mutationFn: ({ workOrderId, ...payload }) =>
      completeWorkOrderApi(workOrderId, payload),
    onSuccess: (_data, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mechanic'] }),
        queryClient.invalidateQueries({
          queryKey: ['mechanic', 'assigned-orders'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['mechanic', 'assigned-order', variables.workOrderId],
        }),
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'assigned'] }),
        queryClient.invalidateQueries({ queryKey: ['work-bays'] }),
        queryClient.invalidateQueries({ queryKey: ['work-order-tracking'] }),
      ]);
    },
  });
}