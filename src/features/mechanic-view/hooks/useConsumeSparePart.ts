import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mechanicService } from '../api/mechanic-service';

interface ConsumePartVariables {
  workOrderId: string;
  workOrderPartId: string;
  quantity: number;
}

export function useConsumeSparePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, workOrderPartId, quantity }: ConsumePartVariables) =>
      mechanicService.consumePart(workOrderId, workOrderPartId, quantity),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mechanic'],
      });
    },
  });
}
