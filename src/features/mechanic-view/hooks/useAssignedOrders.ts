import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/httpClient';
import { mockDb } from '../../../shared/api/mock-db';
import { mechanicService } from '../api/mechanic-service';
import type { AssignedWorkOrderDetail, WorkOrderTask, WorkOrderPart } from '../api/types';
import type { WorkOrder } from '../../../shared/types/openapi';

function isAuthOrNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return [0, 401, 403, 408].includes(error.statusCode) || /network|timeout|timed out/i.test(error.message);
  }
  return error instanceof Error && /network|timeout|timed out|failed to fetch/i.test(error.message);
}

function mapMockOrderToDetail(order: WorkOrder): AssignedWorkOrderDetail {
  const tasks: WorkOrderTask[] = order.laborItems.map((l) => ({
    id: l.id,
    description: l.description,
    estimatedHours: l.estimatedHours,
    isCompleted: l.isCompleted,
  }));

  const parts: WorkOrderPart[] = order.partsItems.map((p) => ({
    id: p.id,
    quotePartId: p.quotePartId ?? p.id,
    partCode: p.partCode,
    description: p.description,
    quantityRequired: p.quantityRequired,
    quantityUsed: p.quantityUsed,
    status: p.status,
  }));

  return {
    id: order.id,
    vehicleId: order.id,
    plate: order.vehiclePlate,
    status: order.status,
    initialComplaint: order.entryReason,
    assignedAt: order.entryDate,
    vehicle: {
      brand: order.vehicleBrand,
      model: order.vehicleModel,
      year: order.vehicleYear,
    },
    tasks,
    parts,
    diagnosticReport: order.diagnosticReport ?? null,
    statusHistory: order.statusHistory,
  };
}

const mockMechanicOrders: AssignedWorkOrderDetail[] = mockDb
  .getWorkOrders()
  .filter((o) => Boolean(o.primaryMechanicId))
  .map(mapMockOrderToDetail);

export function useAssignedOrders() {
  return useQuery<AssignedWorkOrderDetail[]>({
    queryKey: ['mechanic', 'assigned-orders'],
    queryFn: async () => {
      try {
        const list = await mechanicService.getAssigned(1, 100);
        const details = await Promise.allSettled(
          list.data.map((o) => mechanicService.getAssignedDetail(o.id)),
        );
        return details
          .filter((r): r is PromiseFulfilledResult<AssignedWorkOrderDetail> =>
            r.status === 'fulfilled',
          )
          .map((r) => r.value);
      } catch (error) {
        if (!isAuthOrNetworkError(error)) throw error;
        return mockMechanicOrders;
      }
    },
    staleTime: 30_000,
    retry: 1,
  });
}
