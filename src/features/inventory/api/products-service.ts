import { apiClient, type ApiResponse } from '../../../shared/api/api-client';

// HU-12 / CA-2: the backend catalog exposes a flat array with exactly these
// fields (SparePartResponseDto). There is no pagination envelope.
export interface SparePart {
  id: string;
  code: string;
  name: string;
  unitPrice: string;
  availableStock: number;
  reservedStock: number;
  isActive: boolean;
}

export interface InventoryStats {
  totalItems: number;
  totalUnitsAvailable: number;
  totalUnitsReserved: number;
  activeCount: number;
  inactiveCount: number;
}

export const productsService = {
  async getAll(): Promise<ApiResponse<SparePart[]>> {
    const response = await apiClient.getHttp<SparePart[]>('/spare-parts');
    return { ...response, data: response.data ?? [] };
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