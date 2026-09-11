import type { components } from '../../../shared/api/schema.gen';
import { httpClient } from '../../../shared/api/httpClient';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

export function normalizeTrackingPlate(plate: string): string {
  return plate.trim().toUpperCase();
}

export async function getTrackingSummary(plate: string, signal?: AbortSignal): Promise<TrackingOrder[]> {
  const normalizedPlate = normalizeTrackingPlate(plate);
  const response = await httpClient.get<TrackingOrder[]>('/work-orders/tracking-summary', {
    params: { licensePlate: normalizedPlate },
    signal,
  });
  return response.data;
}
