export interface PublicTrackingParams {
  licensePlate: string;
  nationalId: string;
}

// US-17 / RN-17: contrato real de POST /api/v1/public-tracking.
// El backend solo expone estos campos; nunca precios, mecánicos ni notas.
export interface PublicTrackingResponse {
  workOrderNumber: string;
  vehicleModel: string;
  status: string;
  receivedAt: string;
  readyForPickup: boolean;
  tasksSummary: string[];
}
