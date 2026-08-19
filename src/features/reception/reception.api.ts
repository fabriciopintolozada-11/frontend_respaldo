import { apiRequest } from '../../lib/api-client'
import type {
  CreatedWorkOrderResponse,
  RegisterVehicleEntryRequest,
  VehicleHistoryResponse,
} from './reception.types'
import { normalizePlate } from './reception.validation'

export function getVehicleHistory(plate: string, signal?: AbortSignal) {
  return apiRequest<VehicleHistoryResponse>(
    `/vehicles/${encodeURIComponent(normalizePlate(plate))}/history`,
    { signal },
  )
}

export function createWorkOrder(request: RegisterVehicleEntryRequest) {
  return apiRequest<CreatedWorkOrderResponse>('/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}
