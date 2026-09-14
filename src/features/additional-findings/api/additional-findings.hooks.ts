import { useMutation, useQueryClient } from '@tanstack/react-query';

import { additionalFindingsService } from './additional-findings.service';
import type {
  ApproveAdditionalFindingPayload,
  RejectAdditionalFindingPayload,
} from './types';

// US-21 (FE-08/FE-09): after a decision the reception/lead board and the
// mechanic console are stale, so both query sub-trees are invalidated. The
// mechanic leaf lives under ['mechanic'] and the board under
// ['work-order-tracking'].
export function useApproveAdditionalFinding(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveAdditionalFindingPayload) =>
      additionalFindingsService.approve(workOrderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work-order-tracking'] });
      void queryClient.invalidateQueries({ queryKey: ['mechanic'] });
    },
  });
}

export function useRejectAdditionalFinding(workOrderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectAdditionalFindingPayload) =>
      additionalFindingsService.reject(workOrderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work-order-tracking'] });
      void queryClient.invalidateQueries({ queryKey: ['mechanic'] });
    },
  });
}