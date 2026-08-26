import { ApiError, httpClient } from '../../../shared/api/httpClient'
import type {
  CreatedWorkOrderResponse,
  RegisterVehicleEntryRequest,
  VehicleHistoryResponse,
} from '../vehicle-registration.types'
import { normalizePlate } from '../vehicle-registration.validation'

export async function getVehicleHistory(plate: string, signal?: AbortSignal) {
  try {
    const response = await httpClient.get<VehicleHistoryResponse>(
      `/vehicles/${encodeURIComponent(normalizePlate(plate))}/history`,
      { signal },
    )
    return response.data
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null
    throw error
  }
}

export async function createWorkOrder(request: RegisterVehicleEntryRequest) {
  if (request.vehicle.isFullyElectric) {
    const message = 'Los vehículos 100% eléctricos no pueden ser recibidos por el taller.'
    throw new ApiError(422, message, { statusCode: 422, message })
  }

  const response = await httpClient.post<CreatedWorkOrderResponse>('/work-orders', request)
  return response.data
}
