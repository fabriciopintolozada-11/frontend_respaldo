import type {
  SettlementAdjustmentResponse,
  SettlementResponse,
} from '../api/settlement.types';
import type { components } from '../../../shared/api/schema.gen';

export type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

export const ORDER_ID = '11111111-1111-4111-8111-111111111111';

export const mockSettlementResponse: SettlementResponse = {
  workOrderId: ORDER_ID,
  status: 'LISTO_ENTREGA',
  plate: 'ABC1234',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
  customerName: 'Juan Pérez',
  laborSubtotal: '950.00',
  parts: [
    {
      id: 'part-1',
      code: 'FIL-001',
      name: 'Filtro de aceite',
      quantity: 2,
      unitPrice: '120.50',
      subtotal: '241.00',
    },
  ],
  partsSubtotal: '241.00',
  total: '1191.00',
  currency: 'BOB',
  discountsTotal: '50.00',
  totalAfterDiscounts: '1141.00',
  adjustments: [
    {
      id: 'adj-1',
      type: 'DISCOUNT',
      amount: '50.00',
      reason: 'Descuento por servicio incompleto',
      createdAt: '2026-09-12T15:00:00.000Z',
    },
  ],
};

export const mockAppliedDiscount: SettlementAdjustmentResponse = {
  id: 'adj-2',
  workOrderId: ORDER_ID,
  type: 'DISCOUNT',
  amount: '50.00',
  reason: 'Descuento por servicio incompleto',
  appliedBy: 'usr-lead',
  createdAt: '2026-09-12T15:02:00.000Z',
};

export const mockVoidAdjustment: SettlementAdjustmentResponse = {
  id: 'adj-3',
  workOrderId: ORDER_ID,
  type: 'VOID',
  amount: '50.00',
  reason: 'Descuento aplicado por error, se revierte',
  appliedBy: 'usr-lead',
  createdAt: '2026-09-12T15:10:00.000Z',
};

export const mockDeliverResponse = {
  id: ORDER_ID,
  status: 'ENTREGADO',
  deliveredAt: '2026-09-12T15:30:00.000Z',
  paymentMethod: 'CASH' as const,
  receiptNumber: 'REC-001',
  totalCharged: '1141.00',
  deliveryNotes: 'Cliente satisfecho',
};

export const mockReadyOrder: TrackingOrder = {
  id: ORDER_ID,
  plate: 'ABC1234',
  model: 'Corolla',
  status: 'LISTO_ENTREGA',
  entryDate: '2026-08-20T12:00:00.000Z',
  daysInWorkshop: 12,
  bayId: null,
  bayNumber: null,
  mechanicName: 'Mario Rojas',
  customerPhone: '+59170000000',
  missingPartName: null,
  pausedReason: null,
  daysWaitingApproval: null,
  isStaleQuote: false,
};