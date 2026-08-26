import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createWorkOrder, getVehicleHistory } from '../api/vehicle-registration-api'
import { normalizePlate } from '../vehicle-registration.validation'

export function useVehicleHistory(plate: string) {
  const normalizedPlate = normalizePlate(plate)

  return useQuery({
    queryKey: ['vehicle-history', normalizedPlate],
    queryFn: ({ signal }) => getVehicleHistory(normalizedPlate, signal),
    enabled: normalizedPlate.length > 0,
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
