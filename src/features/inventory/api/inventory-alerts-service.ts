import { useQuery } from '@tanstack/react-query';

import { httpClient } from '../../../shared/api/httpClient';
import type { InventoryAlertsListResponse, InventoryAlertsParams } from '../inventory-alerts.types';

const inventoryAlertsKeys = {
  all: ['inventory-alerts'] as const,
  list: (params: InventoryAlertsParams) => [...inventoryAlertsKeys.all, params] as const,
};

export async function listInventoryAlerts(params: InventoryAlertsParams = {}): Promise<InventoryAlertsListResponse> {
  const { data } = await httpClient.get<InventoryAlertsListResponse>('/inventory/alerts', { params });
  return data;
}

export function useInventoryAlerts(params: InventoryAlertsParams) {
  return useQuery({
    queryKey: inventoryAlertsKeys.list(params),
    queryFn: () => listInventoryAlerts(params),
    staleTime: 5 * 60 * 1000,
  });
}

export { inventoryAlertsKeys };