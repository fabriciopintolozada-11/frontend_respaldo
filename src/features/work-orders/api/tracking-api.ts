import type { components } from '../../../shared/api/schema.gen';
import { httpClient } from '../../../shared/api/httpClient';
import { buildOnlyStaleQuotesQueryString } from '../../stale-quotes/only-stale-quotes';

type SchemaTrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

// US-21 / BE-T21.1: additive contract of the tracking card. The fields can be
// missing until the backend that includes them is deployed, so both stay
// optional (contrato aditivo).
export interface TrackingOrder extends SchemaTrackingOrder {
  hasPendingAdditionalFinding?: boolean;
  additionalFindingDescription?: string | null;
}

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

export async function getStaleQuoteOrders(signal?: AbortSignal): Promise<TrackingOrder[]> {
  const response = await httpClient.get<TrackingOrder[]>(
    `/work-orders/tracking-summary?${buildOnlyStaleQuotesQueryString(true)}`,
    { signal },
  );
  return response.data;
}