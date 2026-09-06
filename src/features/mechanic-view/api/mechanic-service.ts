import { httpClient } from '../../../shared/api/httpClient';
import type { DiagnosticPayload } from '../../work-orders/schemas/diagnostic-schema';
import type {
  AssignedWorkOrderSummary,
  AssignedWorkOrderDetail,
  PaginatedResponse,
} from './types';

const ASSIGNED_PATH = '/work-orders/assigned';

export interface CreateDiagnosticResponse {
  id: string;
  workOrderId: string;
  description: string;
  suggestedTasks: string[];
  suggestedPartIds: string[];
  estimatedHours: number;
  createdAt: string;
}

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

  // US-11: registers a technical diagnostic for an assigned work order.
  async createDiagnostic(
    orderId: string,
    payload: DiagnosticPayload,
  ): Promise<CreateDiagnosticResponse> {
    const { data } = await httpClient.post<CreateDiagnosticResponse>(
      `/work-orders/${orderId}/diagnostic`,
      payload,
    );
    return data;
  },

  async consumePart(
    workOrderId: string,
    quotePartId: string,
    quantity: number,
  ): Promise<void> {
    await httpClient.post(`/work-orders/${workOrderId}/consume-part`, {
      quotePartId,
      quantity,
    });
  },
};
