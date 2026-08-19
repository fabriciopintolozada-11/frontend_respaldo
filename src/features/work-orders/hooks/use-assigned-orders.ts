import { useQuery } from '@tanstack/react-query'
import { assignedOrdersApi } from '@/features/work-orders/api/assigned-orders-api'

export function useAssignedOrders(page: number, pageSize: number) {
  return useQuery({
    queryKey: ['assigned-orders', page, pageSize],
    queryFn: () => assignedOrdersApi.getAssigned(page, pageSize),
  })
}

export function useAssignedOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ['assigned-order-detail', id],
    queryFn: () => assignedOrdersApi.getAssignedDetail(id!),
    enabled: !!id,
  })
}
