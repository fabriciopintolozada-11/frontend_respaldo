// US-20 contract extracted from the real backend (`taller_back`, rama
// `develop`). Every monetary field is serialized as a string with 2 decimals
// (BE-13 / RN-21); the frontend only formats them for display.
export type PaymentMethod = 'CASH' | 'QR_TRANSFER' | 'CARD';

export type AdjustmentType = 'DISCOUNT' | 'VOID';

export interface SettlementPartItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface SettlementAdjustmentSummary {
  id: string;
  type: AdjustmentType;
  amount: string;
  reason: string;
  createdAt: string;
}

export interface SettlementResponse {
  workOrderId: string;
  status: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  customerName: string;
  laborSubtotal: string;
  parts: SettlementPartItem[];
  partsSubtotal: string;
  total: string;
  currency: string;
  discountsTotal: string;
  totalAfterDiscounts: string;
  adjustments: SettlementAdjustmentSummary[];
}

export interface SettlementAdjustmentResponse {
  id: string;
  workOrderId: string;
  type: AdjustmentType;
  amount: string;
  reason: string;
  appliedBy: string;
  createdAt: string;
}

export interface DeliverResponse {
  id: string;
  status: string;
  deliveredAt: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  totalCharged: string;
  deliveryNotes: string | null;
}