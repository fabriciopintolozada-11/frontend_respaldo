import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../../shared/api/http-client'
import type {
  CreatedWorkOrderResponse,
  RegisterVehicleEntryRequest,
  VehicleHistoryResponse,
} from '../reception.types'
import { normalizePlate } from '../reception.validation'

export async function getVehicleHistory(
  plate: string,
  signal?: AbortSignal,
) {
  const data = await apiRequest<VehicleHistoryResponse[]>(
    `/vehicles?plate=${encodeURIComponent(normalizePlate(plate))}`,
    { signal },
  )

  return data[0] ?? null
}

export function useVehicleHistory(plate: string) {
  return useQuery({
    queryKey: ['vehicle-history', plate],
    queryFn: ({ signal }) => getVehicleHistory(plate, signal),
    enabled: plate.length > 0,
  })
}

export function createWorkOrder(
  request: RegisterVehicleEntryRequest,
) {
  return apiRequest<CreatedWorkOrderResponse>('/workOrders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}