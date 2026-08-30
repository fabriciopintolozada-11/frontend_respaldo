import { httpClient } from '../../../shared/api/httpClient';
import type { components } from '../../../shared/api/schema.gen';

export type VehicleStatusResponse = components['schemas']['VehicleStatusResponseDto'];

export type VehicleStatusParams = {
  plate: string;
  identification: string;
};

export const vehicleStatusApi = {
  async getStatus(params: VehicleStatusParams): Promise<VehicleStatusResponse> {
    const response = await httpClient.get<VehicleStatusResponse>('/public/vehicle-status', { params });
    return response.data;
  },
};
