import { ApiError } from '../../../shared/api/httpClient';

// US-19 / FE-04: maps backend error codes to contextual, comprehensible
// messages for the complete-repair flow. Financial/pricing content is never
// surfaced here (RN-16).
export interface CompleteErrorDetails {
  code: string | number;
  message: string;
}

export function translateCompleteError(error: unknown): CompleteErrorDetails {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 403:
        return {
          code: 403,
          message:
            'Solo el mecánico asignado o el jefe de taller puede concluir esta reparación.',
        };
      case 404:
        return {
          code: 404,
          message: 'La orden de trabajo no fue encontrada.',
        };
      case 409:
        return {
          code: 409,
          message:
            'La orden no está en estado En Reparación y no se puede concluir.',
        };
      case 422:
        // RN-05: the Gherkin message expected by US-19.
        return {
          code: 422,
          message:
            'No se puede finalizar la orden mientras existan repuestos pendientes de llegada o piezas sin regularizar.',
        };
      case 401:
        return {
          code: 401,
          message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
        };
      default:
        return { code: error.statusCode, message: error.message };
    }
  }
  return {
    code: 'UNKNOWN',
    message:
      'Error inesperado al concluir la reparación. Inténtalo de nuevo.',
  };
}