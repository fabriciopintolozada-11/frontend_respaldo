import { useQuery } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';
import type {
  AssignedWorkOrderDetail,
  WorkOrderPart,
  WorkOrderTask,
} from '../api/types';

// HU-13: the real backend detail exposes the approved quote with
// sparePartId (the id the awaiting-part endpoint accepts). Map it into the
// WorkOrderPart shape the mechanic console and the modal consume. Fields the
// real backend does not expose (tasks, diagnosticReport, statusHistory) are
// defaulted so the UI renders without crashing.
function mapQuotePartToWorkOrderPart(part: {
  id: string;
  sparePartId: string;
  quantity: number;
  status: string;
  sparePart: { id: string; code: string; name: string };
}): WorkOrderPart {
  const status: WorkOrderPart['status'] =
    part.status === 'RESERVED'
      ? 'RESERVADO'
      : part.status === 'INSTALLED'
        ? 'INSTALADO'
        : 'PENDIENTE';
  return {
    id: part.id,
    sparePartId: part.sparePartId,
    partCode: part.sparePart.code,
    description: part.sparePart.name,
    quantityRequired: part.quantity,
    quantityUsed: 0,
    status,
  };
}

function mapRealDetailToAssignedDetail(detail: Record<string, any>): AssignedWorkOrderDetail {
  const quoteParts = Array.isArray(detail.quote?.parts)
    ? detail.quote.parts.map(mapQuotePartToWorkOrderPart)
    : [];

  return {
    id: detail.id,
    vehicleId: detail.vehicleId,
    plate: detail.plate,
    status: detail.status,
    initialComplaint: detail.initialComplaint,
    assignedAt: detail.assignedAt,
    vehicle: detail.vehicle ?? {
      brand: detail.brand,
      model: detail.model,
      year: detail.year,
    },
    tasks: (detail.tasks as WorkOrderTask[]) ?? [],
    parts: quoteParts.length > 0 ? quoteParts : ((detail.parts as WorkOrderPart[]) ?? []),
    diagnosticReport: detail.diagnosticReport ?? null,
    statusHistory: detail.statusHistory ?? [],
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
        .map((r) => mapRealDetailToAssignedDetail(r.value));
    },
    staleTime: 30_000,
    retry: 1,
  });
}
