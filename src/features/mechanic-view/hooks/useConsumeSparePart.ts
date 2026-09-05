import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';

interface ConsumePartVariables {
  workOrderId: string;
  quotePartId: string;
  quantity: number;
}

export function useConsumeSparePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, quotePartId, quantity }: ConsumePartVariables) =>
      mechanicService.consumePart(workOrderId, quotePartId, quantity),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mechanic'],
      });
    },
  });
}
