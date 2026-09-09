import { useQuery } from '@tanstack/react-query';

import { workBaysService } from '../api/work-bays-service';

export const workBaysKeys = {
  all: ['work-bays'] as const,
  monitoring: () => [...workBaysKeys.all, 'monitoring'] as const,
};

const MONITORING_REFETCH_INTERVAL_MS = 30_000;

export function useWorkBaysMonitoring() {
  return useQuery({
    queryKey: workBaysKeys.monitoring(),
    queryFn: () => workBaysService.getMonitoring(),
    refetchInterval: MONITORING_REFETCH_INTERVAL_MS,
  });
}