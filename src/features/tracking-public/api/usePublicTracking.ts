import { useMutation } from '@tanstack/react-query';

import { ApiError } from '../../../shared/api/httpClient';
import { publicTrackingService } from './public-tracking-service';
import type { PublicTrackingResponse } from './public-tracking.types';

export interface PublicTrackingLookup {
  plate: string;
  identification: string;
}

// US-17 / FE-08: el endpoint público es POST, por lo que se modela como mutación
// (sin caché obsoleta entre búsquedas). RN-17 / FE-04: nunca se reintenta un 404
// (dato inexistente) ni un 429 (para no agravar el rate limiting).
export function usePublicTracking() {
  return useMutation<PublicTrackingResponse, ApiError, PublicTrackingLookup>({
    mutationFn: ({ plate, identification }) =>
      publicTrackingService.track({
        licensePlate: plate,
        nationalId: identification,
      }),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 429)) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
