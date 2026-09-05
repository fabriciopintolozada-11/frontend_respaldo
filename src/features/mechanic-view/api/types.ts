export interface AssignedWorkOrderSummary {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
}

// HU-03 / RN-16: detail of an assigned work order as exposed by the backend.
// Brand/model/year are at the root and the reserved spare parts live in
// `reservedParts`. No financial fields are present (RN-16 / BE-12).
export interface AssignedWorkOrderDetail {
  id: string;
  vehicleId: string;
  plate: string;
  status: string;
  initialComplaint: string;
  assignedAt: string | null;
  brand: string;
  model: string;
  year: number;
  reservedParts: ReservedPartDetail[];
}

// HU-07 / RN-16: a reserved spare part line as exposed by the backend for an
// assigned work order. No financial fields (prices) are present.
export interface ReservedPartDetail {
  quotePartId: string;
  code: string;
  name: string;
  quantityReserved: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}

// HU-07: shape consumed by ReservedPartsPanel. quotePartId is the identifier
// the consume-part endpoint needs.
export interface ReservedPart {
  id: string;
  quotePartId: string;
  code: string;
  name: string;
  quantityReserved: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}