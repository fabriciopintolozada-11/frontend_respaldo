import { useMutation, useQueryClient } from '@tanstack/react-query';

import { workOrdersService } from '../../work-orders/api/work-orders-service';
import {
  setWorkOrderAwaitingPart,
  type SetAwaitingPartPayload,
} from '../api/awaiting-part-api';

import type { WorkOrderStatus } from '../../../shared/types/openapi';
import type { AssignedWorkOrderDetail } from '../api/types';

export function useMechanicMutations() {
  const queryClient = useQueryClient();

  const key = ['mechanic', 'assigned-orders'] as const;

  const toggleLabor = useMutation({
    mutationFn: ({ orderId, laborId }: { orderId: string; laborId: string }) =>
      workOrdersService.toggleLaborCompletion(orderId, laborId),

    onMutate: async ({ orderId, laborId }) => {
      await queryClient.cancelQueries({ queryKey: key });

      const prev = queryClient.getQueryData<AssignedWorkOrderDetail[]>(key);

      queryClient.setQueryData<AssignedWorkOrderDetail[]>(key, (old) =>
        (old ?? []).map((o) =>
          o.id === orderId
            ? {
                ...o,
                tasks: (o.tasks ?? []).map((t) =>
                  t.id === laborId ? { ...t, isCompleted: !t.isCompleted } : t,
                ),
              }
            : o,
        ),
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(key, ctx.prev);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['alert'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({
      orderId,
      status,
      changedBy,
    }: {
      orderId: string;
      status: WorkOrderStatus;
      changedBy: string;
    }) => workOrdersService.updateStatus(orderId, status, changedBy),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const setAwaitingPart = useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: SetAwaitingPartPayload;
    }) => setWorkOrderAwaitingPart(orderId, payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    toggleLabor,
    updateStatus,
    setAwaitingPart,
  };
}
