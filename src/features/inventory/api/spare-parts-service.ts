import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '../../../shared/api/httpClient';
import type {
  CreateInventoryAdjustmentRequest,
  CreateSparePartRequest,
  InventoryAdjustmentResponse,
  SparePart,
  SparePartListResponse,
} from '../spare-parts.types';

export interface SparePartListParams {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

const sparePartsKeys = {
  all: ['spare-parts'] as const,
  list: (params: SparePartListParams) => [...sparePartsKeys.all, params] as const,
};

export async function listSpareParts(params: SparePartListParams = {}): Promise<SparePartListResponse> {
  const { data } = await httpClient.get<unknown>('/spare-parts', { params });
  // HU-12: the real backend returns a flat array [{ id, code, name, unitPrice }].
  // Normalize it into the paginated shape the UI expects.
  if (Array.isArray(data)) {
    return {
      data: data as SparePart[],
      total: data.length,
      page: 1,
      pageSize: data.length || 100,
    };
  }
  return data as SparePartListResponse;
}

export async function createSparePart(payload: CreateSparePartRequest): Promise<SparePart> {
  const { data } = await httpClient.post<SparePart>('/spare-parts', payload);
  return data;
}

export async function deactivateSparePart(id: string): Promise<SparePart> {
  const { data } = await httpClient.post<SparePart>(`/spare-parts/${encodeURIComponent(id)}/deactivate`);
  return data;
}

export async function registerAdjustment(payload: CreateInventoryAdjustmentRequest): Promise<InventoryAdjustmentResponse> {
  const { data } = await httpClient.post<InventoryAdjustmentResponse>('/spare-parts/adjustments', payload);
  return data;
}

export function useSpareParts(params: SparePartListParams) {
  return useQuery({
    queryKey: sparePartsKeys.list(params),
    queryFn: () => listSpareParts(params),
  });
}

export function useCreateSparePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSparePart,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sparePartsKeys.all });
    },
  });
}

export function useDeactivateSparePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateSparePart,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sparePartsKeys.all });
    },
  });
}

export function useRegisterAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerAdjustment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sparePartsKeys.all });
    },
  });
}