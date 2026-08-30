import { httpClient } from '../../../shared/api/httpClient';
import type {
  AssignedWorkOrderSummary,
  AssignedWorkOrderDetail,
  PaginatedResponse,
} from './types';

const ASSIGNED_PATH = '/work-orders/assigned';

export const mechanicService = {
  async getAssigned(
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<AssignedWorkOrderSummary>> {
    const { data } = await httpClient.get<
      PaginatedResponse<AssignedWorkOrderSummary>
    >(ASSIGNED_PATH, { params: { page, pageSize } });
    return data;
  },

  async getAssignedDetail(id: string): Promise<AssignedWorkOrderDetail> {
    const { data } = await httpClient.get<AssignedWorkOrderDetail>(
      `${ASSIGNED_PATH}/${id}`,
    );
    return data;
  },
};
