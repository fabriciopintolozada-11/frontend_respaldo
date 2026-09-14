import { httpClient } from '../../../shared/api/httpClient';
import type { PublicTrackingParams, PublicTrackingResponse } from './public-tracking.types';

// US-17 / FE-03: acceso centralizado al endpoint público real (sin autenticación).
export const publicTrackingService = {
  async track(params: PublicTrackingParams): Promise<PublicTrackingResponse> {
    const { data } = await httpClient.post<PublicTrackingResponse>('/public-tracking', params);
    return data;
  },
};
