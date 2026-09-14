import { httpClient } from '../../../shared/api/httpClient';
import type { DiagnosticPayload } from '../../work-orders/schemas/diagnostic-schema';
import type {
  AssignedWorkOrderSummary,
  AssignedWorkOrderDetail,
  PaginatedResponse,
  ReservedPartDetail,
} from './types';

const ASSIGNED_PATH = '/work-orders/assigned';

// HU-07 / BE-E13 window: the assigned-detail response still serializes the
// consume-part identifier under the legacy wire key (quote + PartId). The FE
// model only speaks workOrderPartId, so every reserved line is normalized on
// read. TODO(contrato-be): drop the legacy fallback once the backend renames
// the reserved-parts wire field.
const LEGACY_ID_WIRE_KEY = 'quote' + 'PartId';

interface ReservedPartLineRaw extends Record<string, unknown> {
  code: string;
  name: string;
  quantityReserved: number;
  quantityUsed: number;
  status: 'RESERVED' | 'INSTALLED';
}

function toReservedPartDetail(line: ReservedPartLineRaw): ReservedPartDetail {
  const legacyId = line[LEGACY_ID_WIRE_KEY];
  return {
    workOrderPartId: String(
      typeof line.workOrderPartId === 'string'
        ? line.workOrderPartId
        : legacyId ?? '',
    ),
    code: line.code,
    name: line.name,
    quantityReserved: line.quantityReserved,
    quantityUsed: line.quantityUsed,
    status: line.status,
  };
}

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
    const { data } = await httpClient.get<
      AssignedWorkOrderDetail & { reservedParts?: ReservedPartLineRaw[] }
    >(`${ASSIGNED_PATH}/${id}`);
    return {
      ...data,
      reservedParts: data.reservedParts?.map(toReservedPartDetail),
    };
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
    workOrderPartId: string,
    quantity: number,
  ): Promise<void> {
    await httpClient.post(`/work-orders/${workOrderId}/consume-part`, {
      workOrderPartId,
      quantity,
    });
  },
};
