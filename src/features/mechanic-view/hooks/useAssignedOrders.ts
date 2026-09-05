import { useQuery } from '@tanstack/react-query';
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