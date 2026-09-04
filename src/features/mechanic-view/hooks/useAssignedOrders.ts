import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/httpClient';
import { mockDb } from '../../../shared/api/mock-db';
import { mechanicService } from '../api/mechanic-service';
import type { AssignedWorkOrderDetail, WorkOrderTask, WorkOrderPart, ReservedPartDetail } from '../api/types';
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

// HU-07: maps the backend assigned-detail response to the type consumed by the
// mechanic console. The backend exposes brand/model/year at the root and the
// reserved spare parts in a dedicated `reservedParts` list (RN-16: no prices).
function mapBackendDetailToDetail(row: {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
  brand?: string;
  model?: string;
  year?: number;
  reservedParts?: ReservedPartDetail[];
}): AssignedWorkOrderDetail {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    plate: row.plate,
    status: row.status,
    initialComplaint: row.initialComplaint,
    assignedAt: row.assignedAt,
    vehicle: {
      brand: row.brand ?? '',
      model: row.model ?? '',
      year: row.year ?? new Date().getFullYear(),
    },
    tasks: [],
    parts: [],
    reservedParts: row.reservedParts,
    diagnosticReport: null,
    statusHistory: [],
  };
}

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
          .map((r) => mapBackendDetailToDetail(r.value as never));
      } catch (error) {
        if (!isAuthOrNetworkError(error)) throw error;
        return mockMechanicOrders;
      }
    },
    staleTime: 30_000,
    retry: 1,
  });
}
