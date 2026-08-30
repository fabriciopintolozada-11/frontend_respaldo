import { apiClient, type ApiResponse } from '../../../shared/api/api-client';
import type { InventoryItem, PartCategory } from '../../../shared/types/openapi';

export interface InventoryStats {
  totalItems: number;
  totalUnitsAvailable: number;
  totalUnitsReserved: number;
  totalStockValueBOB: number;
  lowStockCount: number;
  noRotationAlertCount: number;
  highRotationCount: number;
  categoryBreakdown: Record<PartCategory, number>;
}

type ProductPayload = Omit<
  InventoryItem,
  'id' | 'daysWithoutMovement' | 'lastMovementDate' | 'stockReserved'
>;

interface ProductsListResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

const emptyCategoryBreakdown = (): Record<PartCategory, number> => ({
  MOTOR: 0,
  FRENOS: 0,
  SUSPENSION_DIRECCION: 0,
  TRANSMISION: 0,
  FILTROS_FLUIDOS: 0,
  ELECTRICO_LUCES: 0,
  CLIMATIZACION: 0,
  CARROCERIA_ACCESORIOS: 0,
});

const calculateStats = (products: InventoryItem[]): InventoryStats => {
  const stats: InventoryStats = {
    totalItems: products.length,
    totalUnitsAvailable: 0,
    totalUnitsReserved: 0,
    totalStockValueBOB: 0,
    lowStockCount: 0,
    noRotationAlertCount: 0,
    highRotationCount: 0,
    categoryBreakdown: emptyCategoryBreakdown(),
  };

  products.forEach((product) => {
    stats.categoryBreakdown[product.category] += 1;
    stats.totalUnitsAvailable += product.stockAvailable;
    stats.totalUnitsReserved += product.stockReserved;
    stats.totalStockValueBOB += product.stockAvailable * product.unitCostBOB;

    if (product.stockAvailable <= product.stockMinimum) stats.lowStockCount += 1;
    if (product.daysWithoutMovement >= 60 || product.rotationCategory === 'SIN_ROTACION_ALERTA') {
      stats.noRotationAlertCount += 1;
    }
    if (product.rotationCategory === 'ALTA') stats.highRotationCount += 1;
  });

  return stats;
};

export const productsService = {
  async getAll(): Promise<ApiResponse<InventoryItem[]>> {
    const response = await apiClient.getHttp<ProductsListResponse>('/spare-parts?page=1&pageSize=100');
    return { ...response, data: response.data.data };
  },

  async getById(id: string): Promise<ApiResponse<InventoryItem>> {
    return apiClient.getHttp<InventoryItem>(`/spare-parts/${id}`);
  },

  async getStats(): Promise<ApiResponse<InventoryStats>> {
    const response = await this.getAll();
    return {
      ...response,
      data: calculateStats(response.data),
    };
  },

  async registerProduct(payload: ProductPayload): Promise<ApiResponse<InventoryItem>> {
    return apiClient.postHttp<ProductPayload, InventoryItem>('/spare-parts', payload);
  },

  async updateStock(id: string, addedStock: number): Promise<ApiResponse<InventoryItem>> {
    return apiClient.postHttp<{ quantity: number }, InventoryItem>(`/spare-parts/${id}/stock-adjustments`, {
      quantity: addedStock,
    });
  },
};
