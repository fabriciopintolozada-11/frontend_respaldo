import type { ApiResponse } from '../../../shared/api/api-client';
import { listSpareParts } from './spare-parts-service';
import type { SparePart } from '../spare-parts.types';

export type { SparePart, SparePartCategory } from '../spare-parts.types';

export interface InventoryStats {
  totalItems: number;
  totalUnitsAvailable: number;
  totalUnitsReserved: number;
  activeCount: number;
  inactiveCount: number;
}

export const productsService = {
  async getAll(): Promise<ApiResponse<SparePart[]>> {
    const response = await listSpareParts({ pageSize: 100 });
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  },

  async getStats(): Promise<ApiResponse<InventoryStats>> {
    const response = await this.getAll();
    const data = response.data;
    const stats: InventoryStats = {
      totalItems: data.length,
      totalUnitsAvailable: data.reduce((sum, p) => sum + p.availableStock, 0),
      totalUnitsReserved: data.reduce((sum, p) => sum + p.reservedStock, 0),
      activeCount: data.filter((p) => p.isActive).length,
      inactiveCount: data.filter((p) => !p.isActive).length,
    };
    return { ...response, data: stats };
  },
};