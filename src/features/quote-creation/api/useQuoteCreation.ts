import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, type ApiResponse } from '../../../shared/api/api-client';
import type { QuoteItemInput, QuoteItemType } from '../schemas/quote-schema';
import { productsService, type SparePart } from '../../inventory/api/products-service';

export type { QuoteItemInput, QuoteItemType } from '../schemas/quote-schema';

// HU-12: shapes contractually exposed by the backend.
export interface PendingQuoteWorkOrder {
  id: string;
  vehicleId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  customerName: string;
  status: string;
  initialComplaint: string;
  createdAt: string;
}

export interface Diagnostic {
  id: string;
  workOrderId: string;
  description: string;
  suggestedTasks: string[];
  suggestedPartIds: string[];
  estimatedHours: number;
  createdAt: string;
}

export interface QuoteDetail {
  id: string;
  description: string;
  itemType: QuoteItemType;
  quantity: string;
  unitPrice: string;
  subtotal: string;
}

export interface QuoteResponse {
  id: string;
  workOrderId: string;
  items: QuoteDetail[];
  total: string;
  laborSubtotal: string;
  partsSubtotal: string;
  currency: string;
  createdAt: string;
}

async function getPendingQuoteOrders(): Promise<ApiResponse<PendingQuoteWorkOrder[]>> {
  const response = await apiClient.getHttp<PendingQuoteWorkOrder[]>('/work-orders/pending-quote');
  return { ...response, data: response.data ?? [] };
}

async function getDiagnostic(workOrderId: string): Promise<ApiResponse<Diagnostic>> {
  return apiClient.getHttp<Diagnostic>(`/work-orders/${encodeURIComponent(workOrderId)}/diagnostic`);
}

async function getCatalog(): Promise<ApiResponse<SparePart[]>> {
  return productsService.getAll();
}

async function createQuote(workOrderId: string, items: QuoteItemInput[]): Promise<ApiResponse<QuoteResponse>> {
  return apiClient.postHttp<{ items: QuoteItemInput[] }, QuoteResponse>(
    `/work-orders/${encodeURIComponent(workOrderId)}/quote`,
    { items },
  );
}

export function usePendingQuoteOrders() {
  return useQuery({
    queryKey: ['work-orders', 'pending-quote'],
    queryFn: getPendingQuoteOrders,
  });
}

export function useDiagnostic(workOrderId?: string) {
  return useQuery({
    queryKey: ['work-orders', 'diagnostic', workOrderId],
    queryFn: () => getDiagnostic(workOrderId as string),
    enabled: Boolean(workOrderId),
  });
}

export function useSparePartsCatalog() {
  return useQuery({
    queryKey: ['spare-parts'],
    queryFn: getCatalog,
  });
}

export function useCreateQuote(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: QuoteItemInput[]) => createQuote(workOrderId, items),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'pending-quote'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
      ]);
    },
  });
}