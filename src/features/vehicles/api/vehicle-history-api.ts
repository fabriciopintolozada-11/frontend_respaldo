import type { components } from '../../../shared/api/schema.gen';
import { httpClient } from '../../../shared/api/httpClient';

export type VehicleHistory = components['schemas']['VehicleHistoryResponseDto'];

export function normalizeVehiclePlate(plate: string): string {
  return plate.trim().toUpperCase();
}

export async function getVehicleHistory(plate: string, signal?: AbortSignal): Promise<VehicleHistory> {
  const normalizedPlate = normalizeVehiclePlate(plate);
  const response = await httpClient.get<VehicleHistory>(
    `/vehicles/${encodeURIComponent(normalizedPlate)}/history`,
    { signal },
  );
  return response.data;
}
