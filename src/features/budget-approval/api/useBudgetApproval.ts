import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { request } from '../../../shared/api/httpClient';

export type BudgetItemType = 'LABOR' | 'PART';

export interface QuoteApprovalItem {
  id: string;
  description: string;
  itemType: BudgetItemType;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  status: string;
  code?: string;
}

export interface QuoteApprovalWorkOrder {
  id: string;
  status: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  clientName: string;
  clientDocument: string;
  clientPhone: string | null;
  entryReason: string;
  createdAt: string;
}

export interface QuoteApprovalBudget {
  id: string;
  workOrderId: string;
  total: string;
  laborSubtotal: string;
  partsSubtotal: string;
  currency: string;
  status: string;
  createdAt: string;
}

export interface BudgetApprovalData {
  quoteId: string;
  workOrderId: string;
  workOrder: QuoteApprovalWorkOrder;
  budget: QuoteApprovalBudget;
  items: QuoteApprovalItem[];
  isFullyElectric: boolean;
}

export interface BudgetApprovalListItem {
  orderId: string;
  orderCode: string | null;
  vehiclePlate: string;
  vehicleDescription: string;
  clientName: string;
  status: string;
  totalBOB: string;
  isFullyElectric: boolean;
}

export interface ApprovalListResponse {
  data: BudgetApprovalListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type BudgetApprovalChannel = 'CALL' | 'WHATSAPP' | 'IN_PERSON';
export type BudgetDecision = 'APPROVED' | 'REJECTED';

export interface BudgetDecisionPayload {
  decision: BudgetDecision;
  channel: BudgetApprovalChannel;
  customerName: string;
  notes: string;
  reason?: string;
}

export interface QuoteDecisionResponse {
  id: string;
  quoteId: string;
  workOrderId: string;
  decision: BudgetDecision;
  channel?: BudgetApprovalChannel;
  customerName?: string;
  notes?: string;
  reason?: string;
  createdAt: string;
}

// The backend stores the full quote and decides on the whole budget. Approving
// reserves ALL quoted parts (POST /work-orders/:id/approve-quote) and
// rejecting frees them (POST /work-orders/:id/reject-quote). Both the list and
// the detail always hit the real API:
//   GET /budgets/approval                                      (list)
//   GET /work-orders/work-orders/:id/budget-approval           (detail; the
//       duplicated work-orders/work-orders prefix is the backend route, keep it)
async function fetchBudgetApproval(orderId: string): Promise<BudgetApprovalData> {
  return request<BudgetApprovalData>({
    url: `/work-orders/work-orders/${encodeURIComponent(orderId)}/budget-approval`,
    method: 'GET',
  });
}

async function fetchApprovalList(): Promise<ApprovalListResponse> {
  return request<ApprovalListResponse>({
    url: '/budgets/approval',
    method: 'GET',
  });
}

async function submitBudgetApproval(orderId: string, payload: BudgetDecisionPayload): Promise<QuoteDecisionResponse> {
  if (payload.decision === 'APPROVED') {
    return request<QuoteDecisionResponse>({
      url: `/work-orders/${encodeURIComponent(orderId)}/approve-quote`,
      method: 'POST',
      data: { channel: payload.channel, customerName: payload.customerName, notes: payload.notes },
    });
  }
  return request<QuoteDecisionResponse>({
    url: `/work-orders/${encodeURIComponent(orderId)}/reject-quote`,
    method: 'POST',
    data: { reason: payload.reason },
  });
}

export function useBudgetApproval(orderId?: string) {
  return useQuery({
    queryKey: ['budget-approval', orderId],
    queryFn: () => fetchBudgetApproval(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useBudgetApprovalList() {
  return useQuery({
    queryKey: ['budget-approval-list'],
    queryFn: fetchApprovalList,
    select: (response: ApprovalListResponse) => response.data,
  });
}

export function useSubmitBudgetApproval(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BudgetDecisionPayload) => submitBudgetApproval(orderId, payload),
    onSuccess: async () => {
      // After a decision the backend moves the order to APROBADO/RECHAZADO and
      // the approval endpoints no longer serve it, so the detail query must NOT
      // be refetched here (it would 404). Only refresh the list and the
      // dashboard caches that source from the work-order statuses.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budget-approval-list'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'assigned'] }),
        queryClient.invalidateQueries({ queryKey: ['mechanic', 'assigned-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['bays'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
    },
  });
}