import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../lib/api-error'
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
  const normalizedPlate = normalizePlate(plate)

  return useQuery({
    queryKey: ['vehicle-history', normalizedPlate],
    queryFn: ({ signal }) => getVehicleHistory(normalizedPlate, signal),
    enabled: normalizedPlate.length > 0,
  })
}

export async function createWorkOrder(
  request: RegisterVehicleEntryRequest,
) {
  if (request.vehicle.isFullyElectric) {
    throw new ApiError(422, {
      message: 'Los vehículos 100% eléctricos no pueden ser recibidos por el taller.',
    })
  }

  const plate = normalizePlate(request.plate)
  const existingVehicle = await getVehicleHistory(plate)
  const vehicle = existingVehicle ?? await apiRequest<VehicleHistoryResponse>('/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `vehicle-${crypto.randomUUID()}`,
      plate,
      brand: request.vehicle.brand,
      model: request.vehicle.model,
      year: request.vehicle.year,
      is_fully_electric: false,
      customer_id: `customer-${crypto.randomUUID()}`,
      customer_identification: request.customer.identification,
      customer_name: request.customer.name,
      ...(request.customer.phone ? { customer_phone: request.customer.phone } : {}),
      history: [],
    }),
  })

  const workOrder: CreatedWorkOrderResponse = {
    id: `work-order-${crypto.randomUUID()}`,
    vehicle_id: vehicle.id,
    customer_id: vehicle.customer_id,
    status: 'OPEN',
    initial_complaint: request.initialComplaint,
    created_at: new Date().toISOString(),
  }

  return apiRequest<CreatedWorkOrderResponse>('/workOrders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workOrder),
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: (_order, request) => queryClient.invalidateQueries({
      queryKey: ['vehicle-history', normalizePlate(request.plate)],
    }),
  })
}
