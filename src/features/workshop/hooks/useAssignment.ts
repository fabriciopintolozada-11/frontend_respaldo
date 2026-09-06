import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assignmentService } from '../api/assignment-service';

export const assignmentKeys = {
  all: ['workshop', 'assignment'] as const,
  pending: () => [...assignmentKeys.all, 'pending'] as const,
  mechanics: () => [...assignmentKeys.all, 'mechanics'] as const,
};

export function usePendingAssignments(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: assignmentKeys.pending(),
    queryFn: () => assignmentService.getPendingAssignments(page, pageSize),
  });
}

export function useActiveMechanics() {
  return useQuery({
    queryKey: assignmentKeys.mechanics(),
    queryFn: () => assignmentService.getActiveMechanics(),
  });
}

export function useAssignOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, mechanicId }: { orderId: string; mechanicId: string }) =>
      assignmentService.assignToMechanic(orderId, mechanicId),
    onSuccess: () => {
      // FE-09 / RN-14: the assigned order must leave the pending queue.
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.pending() });
    },
  });
}