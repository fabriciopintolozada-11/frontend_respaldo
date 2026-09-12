import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { settlementService, type TrackingOrder } from './settlement-service';
import type {
  PaymentMethod,
  SettlementResponse,
} from './settlement.types';

export function useSettlement(workOrderId: string) {
  return useQuery<SettlementResponse>({
    queryKey: ['settlement', workOrderId],
    queryFn: () => settlementService.getSettlement(workOrderId),
    enabled: Boolean(workOrderId),
  });
}

// US-20: settlement index. Reuses the tracking summary filtered to orders in
// LISTO_ENTREGA so reception and the workshop lead can open a settlement.
export function useReadyToDeliverOrders() {
  return useQuery<TrackingOrder[]>({
    queryKey: ['settlement', 'ready-to-deliver'],
    queryFn: () => settlementService.listReadyToDeliver(),
    staleTime: 30_000,
  });
}

export function useApplyDiscount(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; reason: string }) =>
      settlementService.applyDiscount(workOrderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settlement', workOrderId] });
    },
  });
}

export function useVoidAdjustment(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { adjustmentId: string; reason: string }) =>
      settlementService.voidAdjustment(workOrderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settlement', workOrderId] });
    },
  });
}

export function useDeliver(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      paymentMethod: PaymentMethod;
      receiptNumber: string;
      deliveryNotes?: string;
    }) => settlementService.deliver(workOrderId, payload),
    onSuccess: () => {
      // The order left LISTO_ENTREGA, so every settlement view is stale now.
      void queryClient.invalidateQueries({ queryKey: ['settlement', workOrderId] });
      void queryClient.invalidateQueries({ queryKey: ['settlement', 'ready-to-deliver'] });
      void queryClient.invalidateQueries({ queryKey: ['work-order-tracking'] });
      void queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}