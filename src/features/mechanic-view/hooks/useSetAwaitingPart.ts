import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setWorkOrderAwaitingPart,
  type SetAwaitingPartPayload,
} from '../api/awaiting-part-api';

interface AwaitingPartVariables extends SetAwaitingPartPayload {
  workOrderId: string;
}

export function useSetAwaitingPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, ...payload }: AwaitingPartVariables) =>
      setWorkOrderAwaitingPart(workOrderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mechanic'],
      });
    },
  });
}