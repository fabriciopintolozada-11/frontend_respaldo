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

  const vehicle = detail.vehicle ?? {
    brand: detail.brand,
    model: detail.model,
    year: detail.year,
  };

  return {
    id: detail.id,
    vehicleId: detail.vehicleId,
    plate: detail.plate,
    status: detail.status,
    initialComplaint: detail.initialComplaint,
    assignedAt: detail.assignedAt,
    vehicle,
    brand: detail.brand ?? vehicle.brand,
    model: detail.model ?? vehicle.model,
    year: detail.year ?? vehicle.year,
    tasks: (detail.tasks as WorkOrderTask[]) ?? [],
    parts: quoteParts.length > 0 ? quoteParts : ((detail.parts as WorkOrderPart[]) ?? []),
    reservedParts: detail.reservedParts,
    diagnosticReport: detail.diagnosticReport ?? null,
    statusHistory: detail.statusHistory ?? [],
  };
}

// HU-03 / RN-04: lists only the summaries of the work orders assigned to the
// authenticated mechanic. No per-order detail is fetched here to avoid a N+1
// request; each card loads its own detail on demand.
export function useAssignedOrders() {
  return useQuery<AssignedWorkOrderSummary[]>({
    queryKey: ['mechanic', 'assigned-orders'],
    queryFn: async () => {
      const response = await mechanicService.getAssigned(1, 20);
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

// HU-03 / FE-10 + HU-13: per-card detail of an assigned work order. Keeps the
// US-13 mapping quote.parts -> WorkOrderPart (sparePartId) so the awaiting-part
// flow consumes the official contract, while the card renders the reserved
// parts exposed by the backend.
export function useAssignedOrderDetail(orderId: string | null) {
  return useQuery<AssignedWorkOrderDetail>({
    queryKey: ['mechanic', 'assigned-order', orderId],
    queryFn: async () =>
      mapRealDetailToAssignedDetail(
        await mechanicService.getAssignedDetail(orderId as string),
      ),
    enabled: Boolean(orderId),
    staleTime: 30_000,
    retry: 1,
  });
}