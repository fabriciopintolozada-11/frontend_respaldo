import { apiClient } from '@/shared/api/api-client'
import type { AssignedWorkOrderSummary, AssignedWorkOrderDetail, PaginatedResponse } from '@/shared/types/work-order'

const assignedOrdersPath = import.meta.env.VITE_USE_DEMO_API === 'true'
  ? '/demo/mechanic/work-orders'
  : '/work-orders/assigned'

export const assignedOrdersApi = {
  async getAssigned(page = 1, pageSize = 20): Promise<PaginatedResponse<AssignedWorkOrderSummary>> {
    const { data } = await apiClient.get<PaginatedResponse<AssignedWorkOrderSummary>>(
      assignedOrdersPath,
      { params: { page, pageSize } },
    )
    return data
  },

  async getAssignedDetail(id: string): Promise<AssignedWorkOrderDetail> {
    const { data } = await apiClient.get<AssignedWorkOrderDetail>(`${assignedOrdersPath}/${id}`)
    return data
  },
}
