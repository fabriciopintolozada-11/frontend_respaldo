import { useQuery } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';
import type { AssignedWorkOrderDetail } from '../api/types';

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
  reservedParts?: AssignedWorkOrderDetail['reservedParts'];
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
      const list = await mechanicService.getAssigned(1, 100);
      const details = await Promise.allSettled(
        list.data.map((o) => mechanicService.getAssignedDetail(o.id)),
      );
      return details
        .filter((r): r is PromiseFulfilledResult<AssignedWorkOrderDetail> =>
          r.status === 'fulfilled',
        )
        .map((r) => mapBackendDetailToDetail(r.value as never));
    },
    staleTime: 30_000,
    retry: 1,
  });
}
