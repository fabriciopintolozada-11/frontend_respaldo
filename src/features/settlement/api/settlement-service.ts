import { httpClient } from '../../../shared/api/httpClient';
import type { components } from '../../../shared/api/schema.gen';

import type {
  DeliverResponse,
  PaymentMethod,
  SettlementAdjustmentResponse,
  SettlementResponse,
} from './settlement.types';

export type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

// US-20: real HTTP client for the settlement endpoints. No mock branch: the
// environment must run with VITE_DATA_SOURCE=backend (GEN-09).
export const settlementService = {
  async getSettlement(workOrderId: string): Promise<SettlementResponse> {
    const { data } = await httpClient.get<SettlementResponse>(
      `/work-orders/${workOrderId}/settlement`,
    );
    return data;
  },

  // US-20 / RN-15: settlement index lists the orders ready to be delivered
  // (BE-T05.1 reuse) for RECEPTIONIST / WORKSHOP_LEAD / ADMIN.
  async listReadyToDeliver(): Promise<TrackingOrder[]> {
    const { data } = await httpClient.get<TrackingOrder[]>(
      '/work-orders/tracking-summary',
      { params: { status: 'LISTO_ENTREGA' } },
    );
    return data;
  },

  async applyDiscount(
    workOrderId: string,
    payload: { amount: number; reason: string },
  ): Promise<SettlementAdjustmentResponse> {
    const { data } = await httpClient.post<SettlementAdjustmentResponse>(
      `/work-orders/${workOrderId}/settlement/apply-discount`,
      payload,
    );
    return data;
  },

  async voidAdjustment(
    workOrderId: string,
    payload: { adjustmentId: string; reason: string },
  ): Promise<SettlementAdjustmentResponse> {
    const { data } = await httpClient.post<SettlementAdjustmentResponse>(
      `/work-orders/${workOrderId}/settlement/void-adjustment`,
      payload,
    );
    return data;
  },

  async deliver(
    workOrderId: string,
    payload: {
      paymentMethod: PaymentMethod;
      receiptNumber: string;
      deliveryNotes?: string;
    },
  ): Promise<DeliverResponse> {
    const { data } = await httpClient.post<DeliverResponse>(
      `/work-orders/${workOrderId}/deliver`,
      payload,
    );
    return data;
  },
};