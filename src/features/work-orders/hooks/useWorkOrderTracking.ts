import { useQuery } from '@tanstack/react-query';

import { getTrackingSummary, normalizeTrackingPlate } from '../api/tracking-api';

export function useWorkOrderTracking(plate: string) {
  const normalizedPlate = normalizeTrackingPlate(plate);

  return useQuery({
    queryKey: ['work-order-tracking', normalizedPlate],
    queryFn: ({ signal }) => getTrackingSummary(normalizedPlate, signal),
    enabled: normalizedPlate.length > 0,
    staleTime: 30_000,
  });
}
