import { useQuery } from '@tanstack/react-query';

import { getStaleQuoteOrders } from '../../work-orders/api/tracking-api';

export function useStaleQuoteOrders(enabled: boolean) {
  return useQuery({
    queryKey: ['work-order-tracking', 'stale-quotes'],
    queryFn: ({ signal }) => getStaleQuoteOrders(signal),
    enabled,
    staleTime: 30_000,
  });
}