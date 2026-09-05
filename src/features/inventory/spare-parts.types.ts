export type SparePartCategory =
  | 'MOTOR'
  | 'FRENOS'
  | 'SUSPENSION_DIRECCION'
  | 'TRANSMISION'
  | 'FILTROS_FLUIDOS'
  | 'ELECTRICO_LUCES'
  | 'CLIMATIZACION'
  | 'CARROCERIA_ACCESORIOS';

export const SPARE_PART_CATEGORIES: SparePartCategory[] = [
  'MOTOR',
  'FRENOS',
  'SUSPENSION_DIRECCION',
  'TRANSMISION',
  'FILTROS_FLUIDOS',
  'ELECTRICO_LUCES',
  'CLIMATIZACION',
  'CARROCERIA_ACCESORIOS',
];

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: SparePartCategory;
  unitPrice?: string;
  physicalStock: number;
  availableStock: number;
  reservedStock: number;
  lastMovementAt?: string;
  isActive: boolean;
}

export interface SparePartListResponse {
  data: SparePart[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSparePartRequest {
  code: string;
  name: string;
  category: SparePartCategory;
  unitPrice: number;
  initialStock: number;
}

export type InventoryAdjustmentType = 'POSITIVE' | 'NEGATIVE';

export interface CreateInventoryAdjustmentRequest {
  sparePartId: string;
  quantity: number;
  type: InventoryAdjustmentType;
  reason: string;
  inventoryDiscrepancyId?: string;
}

export interface InventoryAdjustmentResponse {
  id: string;
  sparePartId: string;
  previousPhysicalStock: number;
  adjustedPhysicalStock: number;
  quantity: number;
  type: InventoryAdjustmentType;
  reason: string;
  createdAt: string;
}