/**
 * US-18: contrato real del backend para el monitoreo de bahías.
 * Consume GET /api/v1/work-bays/monitoring, que devuelve las 4 bahías
 * físicas ordenadas por bayNumber (1..4).
 */
export type WorkBayMonitoringStatus = 'LIBRE' | 'OCUPADA' | 'ESPERA_REPUESTO' | 'MANTENIMIENTO';

export interface WorkOrderBaySummary {
  id: string;
  status: string;
  plate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  mechanicId: string | null;
  mechanicName: string | null;
  assignedAt: string | null;
  elapsedHours: number;
}

export interface WorkBayMonitoring {
  id: string;
  bayNumber: number;
  isOccupied: boolean;
  status: WorkBayMonitoringStatus;
  currentWorkOrderId: string | null;
  currentWorkOrder: WorkOrderBaySummary | null;
  createdAt: string;
  updatedAt: string;
}