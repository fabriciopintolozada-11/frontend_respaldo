import type { SparePartCategory } from './spare-parts.types';

export type InventoryAlertType = 'NO_ROTATION' | 'STOCK_OUT';

export interface InventoryAlert {
  partId: string;
  code: string;
  name: string;
  category: SparePartCategory;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  daysWithoutMovement: number;
  alertType: InventoryAlertType;
  lastMovementAt: string | null;
}

export interface InventoryAlertsListResponse {
  data: InventoryAlert[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryAlertsParams {
  alertType?: InventoryAlertType;
  category?: SparePartCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const INVENTORY_ALERT_LABELS: Record<InventoryAlertType, string> = {
  NO_ROTATION: 'Sin Rotación / Estancado',
  STOCK_OUT: 'Stock Crítico / Insuficiente',
};