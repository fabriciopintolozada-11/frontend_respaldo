export interface AssignedWorkOrderSummary {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
}

export interface AssignedWorkOrderDetail {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
  vehicle: {
    brand: string;
    model: string;
    year: number;
  };
  // HU-03: brand/model/year are also exposed at the root of the assigned
  // detail. Carried from the backend when present for the per-card view.
  brand?: string;
  model?: string;
  year?: number;
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  // HU-07: reserved spare parts consumed by the ReservedPartsPanel (consume-part).
  reservedParts?: ReservedPartDetail[];
  diagnosticReport: string | null;
  statusHistory: StatusHistoryEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WorkOrderTask {
  id: string;
  description: string;
  estimatedHours: number;
  isCompleted: boolean;
}

export interface WorkOrderPart {
  id: string;
  sparePartId: string;
  partCode: string;
  description: string;
  quantityRequired: number;
  quantityUsed: number;
  status: 'PENDIENTE' | 'RESERVADO' | 'INSTALADO' | 'EN_ESPERA_IMPORTACION';
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  changedBy: string;
  reason?: string;
}

// HU-07 / RN-16: a reserved spare part line as exposed by the backend for an
// assigned work order. quotePartId is the identifier the consume-part endpoint
// needs. No financial fields are present.
export interface ReservedPartDetail {
  quotePartId: string;
  code: string;
  name: string;
  quantityReserved: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}

// HU-07: shape consumed by ReservedPartsPanel.
export interface ReservedPart {
  id: string;
  /** HU-07: id of the approved quote part (RESERVED) that this line maps to.
   *  It differs from `id` and is the value the consume-part endpoint expects. */
  quotePartId?: string;
  partCode: string;
  description: string;
  quantityRequired: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}