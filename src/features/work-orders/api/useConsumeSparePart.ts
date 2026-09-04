import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../shared/api/httpClient';
import { consumePartApi, type ConsumeSparePartDto, type ConsumeSparePartResponse } from './consume-part-api';

// HU-07 / FE-04: maps backend error codes to contextual, comprehensible
// messages. Financial/pricing content is never surfaced here (RN-16).
export interface ConsumePartErrorDetails {
  code: string | number;
  message: string;
  isAuthorizationError: boolean;
  isBusinessRuleError: boolean;
}

export function translateConsumePartError(error: unknown): ConsumePartErrorDetails {
  if (error instanceof ApiError) {
    if (error.statusCode === 403) {
      return {
        code: 403,
        message:
          'RN-04: solo el mecánico asignado u un supervisor autorizado puede confirmar el uso de repuestos.',
        isAuthorizationError: true,
        isBusinessRuleError: false,
      };
    }
    if (error.statusCode === 422) {
      return {
        code: 422,
        message: error.message,
        isAuthorizationError: false,
        isBusinessRuleError: true,
      };
    }
    if (error.statusCode === 404) {
      return {
        code: 404,
        message: 'La orden de trabajo no fue encontrada.',
        isAuthorizationError: false,
        isBusinessRuleError: false,
      };
    }
    if (error.statusCode === 401) {
      return {
        code: 401,
        message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
        isAuthorizationError: true,
        isBusinessRuleError: false,
      };
    }
    return {
      code: error.statusCode,
      message: error.message,
      isAuthorizationError: false,
      isBusinessRuleError: false,
    };
  }
  return {
    code: 'UNKNOWN',
    message: 'Error inesperado al confirmar el uso del repuesto. Inténtalo de nuevo.',
    isAuthorizationError: false,
    isBusinessRuleError: false,
  };
}

// Variables consumed by the mutation. workOrderId travels in each call so a
// single hook instance can serve a list of work orders (mechanic console).
export interface ConsumePartVariables extends ConsumeSparePartDto {
  workOrderId: string;
}

// HU-07 / FE-T07.2: mutation to confirm the installation and use of a
// reserved spare part. The DTO mirrors the backend ConsumeSparePartDto. After
// a successful confirmation the dependent queries are invalidated (FE-09):
// work order detail, mechanic assigned list, inventory catalog and alerts.
export function useConsumeSparePart(mutationKey?: readonly unknown[]) {
  const queryClient = useQueryClient();

  return useMutation<ConsumeSparePartResponse, unknown, ConsumePartVariables>({
    mutationKey: mutationKey ?? ['consume-part'],
    mutationFn: ({ workOrderId, quotePartId, quantity }) =>
      consumePartApi.consumePart(workOrderId, { quotePartId, quantity }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-orders', variables.workOrderId] }),
        queryClient.invalidateQueries({ queryKey: ['assigned-orders', variables.workOrderId] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders', 'assigned'] }),
        queryClient.invalidateQueries({ queryKey: ['mechanic', 'assigned-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['mechanic'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['bays'] }),
        queryClient.invalidateQueries({ queryKey: ['alert'] }),
      ]);
    },
  });
}
