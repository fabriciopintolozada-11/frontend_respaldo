/**
 * US-18: contrato frontend de monitoreo de bahías.
 * Consume GET /api/v1/work-bays/monitoring. El backend aún no expone este
 * endpoint; cuando exista, revisar el campo DTO y ajustar estos tipos.
 */
export type WorkBayMonitoringStatus = 'DISPONIBLE' | 'EN_DIAGNOSTICO' | 'EN_REPARACION' | 'EN_ESPERA_DE_REPUESTO';

export interface WorkBayOccupation {
  vehiclePlate?: string;
  vehicleDescription?: string;
  mechanicName?: string;
  workOrderStatus?: string;
  hoursInStage?: number;
  waitingPartName?: string;
  waitingDays?: number;
}

export interface WorkBayMonitoring {
  bayId: number;
  bayCode: string;
  bayName: string;
  status: WorkBayMonitoringStatus;
  occupation?: WorkBayOccupation;
}