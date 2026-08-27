import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService } from '../../work-orders/api/work-orders-service';
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
                tasks: o.tasks.map((t) =>
                  t.id === laborId ? { ...t, isCompleted: !t.isCompleted } : t,
                ),
              }
            : o,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const confirmPart = useMutation({
    mutationFn: ({
      orderId,
      partItemId,
    }: {
      orderId: string;
      partItemId: string;
    }) => workOrdersService.confirmPartInstalled(orderId, partItemId),
    onMutate: async ({ orderId, partItemId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<AssignedWorkOrderDetail[]>(key);
      queryClient.setQueryData<AssignedWorkOrderDetail[]>(key, (old) =>
        (old ?? []).map((o) =>
          o.id === orderId
            ? {
                ...o,
                parts: o.parts.map((p) =>
                  p.id === partItemId ? { ...p, status: 'INSTALADO' as const } : p,
                ),
              }
            : o,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
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

  return { toggleLabor, confirmPart, updateStatus };
}
