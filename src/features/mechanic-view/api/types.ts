export interface AssignedQuotePart {
  id: string;
  sparePartId: string;
  quantity: number;
  status: string;
  sparePart: { id: string; code: string; name: string };
}

export interface AssignedQuote {
  id: string;
  parts: AssignedQuotePart[];
}

export interface AssignedWorkOrderSummary {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
  quote: AssignedQuote | null;
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
  tasks: WorkOrderTask[];
  parts: WorkOrderPart[];
  reservedParts?: ReservedPart[];
  diagnosticReport: string | null;
  statusHistory: StatusHistoryEntry[];
  quote: AssignedQuote | null;
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
  partCode: string;
  description: string;
  quantityRequired: number;
  quantityUsed: number;
  status: 'PENDIENTE' | 'RESERVADO' | 'INSTALADO' | 'EN_ESPERA_IMPORTACION';
}

export interface ReservedPart {
  id: string;
  code: string;
  name: string;
  quantityReserved: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  changedBy: string;
  reason?: string;
}
