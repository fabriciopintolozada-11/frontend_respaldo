import { httpClient } from '../../../shared/api/httpClient';

import type {
  AdditionalFindingResponse,
  ApproveAdditionalFindingPayload,
  RejectAdditionalFindingPayload,
} from './types';

// US-21 (FE-T21.2): real HTTP client for the additional finding decision
// endpoints. No mock branch: the environment must run with
// VITE_DATA_SOURCE=backend (GEN-09).
export const additionalFindingsService = {
  // BE-T21.2 / HU-09 / RN-07: the reception approves the supplementary budget,
  // the suggested parts are reserved and the order resumes EN_REPARACION.
  async approve(
    workOrderId: string,
    payload: ApproveAdditionalFindingPayload,
  ): Promise<AdditionalFindingResponse> {
    const { data } = await httpClient.post<AdditionalFindingResponse>(
      `/work-orders/${workOrderId}/additional-findings/approve`,
      payload,
    );
    return data;
  },

  // BE-T21.2 / RN-19: the finding is archived permanently as "Daño no reparado
  // por decisión del cliente" and the order resumes EN_REPARACION.
  async reject(
    workOrderId: string,
    payload: RejectAdditionalFindingPayload,
  ): Promise<AdditionalFindingResponse> {
    const { data } = await httpClient.post<AdditionalFindingResponse>(
      `/work-orders/${workOrderId}/additional-findings/reject`,
      payload,
    );
    return data;
  },
};