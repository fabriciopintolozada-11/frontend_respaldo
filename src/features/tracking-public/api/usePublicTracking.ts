import { useQuery } from '@tanstack/react-query';

import { ApiError } from '../../../shared/api/httpClient';
import { vehicleStatusApi, type VehicleStatusResponse } from './vehicle-status-api';

export interface PublicTrackingQuery {
  plate: string;
  identification: string;
  enabled?: boolean;
}

export function usePublicTracking({ plate, identification, enabled = true }: PublicTrackingQuery) {
  return useQuery<VehicleStatusResponse, ApiError>({
    queryKey: ['public-vehicle-tracking', plate, identification],
    queryFn: () => vehicleStatusApi.getStatus({ plate, identification }),
    enabled: enabled && Boolean(plate && identification),
    retry: (failureCount, error) => !error.isNotFound && failureCount < 1,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.data ? 30_000 : false),
  });
}
