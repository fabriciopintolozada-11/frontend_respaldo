import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  createInventoryAdjustment,
  type CreateInventoryAdjustmentPayload,
} from '../api/inventory-adjustments-api';

export function useInventoryAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryAdjustmentPayload) =>
      createInventoryAdjustment(payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}