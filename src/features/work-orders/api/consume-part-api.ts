import { httpClient } from '../../../shared/api/httpClient';

// HU-07 contract: mirrors the backend ConsumeSparePartDto.
export interface ConsumeSparePartDto {
  quotePartId: string;
  quantity: number;
}

// HU-07 contract: mirrors the backend WorkOrderPartResponseDto (RN-16 allowlist).
// Financial fields are never present so they cannot be rendered to a mechanic.
export interface ConsumeSparePartResponse {
  id: string;
  code: string;
  name: string;
  quantity: number;
  status: string;
}

export const consumePartApi = {
  async consumePart(
    workOrderId: string,
    dto: ConsumeSparePartDto,
  ): Promise<ConsumeSparePartResponse> {
    const { data } = await httpClient.post<ConsumeSparePartResponse>(
      `/work-orders/${workOrderId}/consume-part`,
      dto,
    );
    return data;
  },
};
