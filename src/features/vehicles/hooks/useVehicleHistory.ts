import { useQuery } from '@tanstack/react-query';

import { getVehicleHistory, normalizeVehiclePlate } from '../api/vehicle-history-api';

export function useVehicleHistory(plate: string, enabled = true) {
  const normalizedPlate = normalizeVehiclePlate(plate);

  return useQuery({
    queryKey: ['vehicle-history', normalizedPlate],
    queryFn: ({ signal }) => getVehicleHistory(normalizedPlate, signal),
    enabled: enabled && normalizedPlate.length > 0,
    staleTime: 30_000,
  });
}
