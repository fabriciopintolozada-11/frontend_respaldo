/**
 * E1 API contract generated from the backend OpenAPI document.
 * Regenerate with openapi-typescript after starting NestJS.
 */

export interface WorkOrderListItem {
  id: string;
  vehicleId: string;
  plate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  customerName: string;
  customerIdentification: string;
  initialComplaint: string;
  status: string;
  createdAt: string;
  mechanicId: string | null;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssignedWorkOrder {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
}

export interface AssignedWorkOrderDetail extends AssignedWorkOrder {
  vehicle: { plate: string; brand: string; model: string; year: number };
}

export interface VehicleStatus {
  workOrderId: string;
  plate: string;
  vehicle: { brand: string; model: string; year: number };
  customerName: string;
  initialComplaint: string;
  createdAt: string;
  status: string;
  stage: string;
  readyForPickup: boolean;
}

export interface Mechanic {
  id: string;
  isActive: boolean;
}
