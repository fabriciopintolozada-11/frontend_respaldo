import { ApiError } from '../../../shared/api/httpClient';

// US-21 / FE-04: maps backend error codes of the additional finding decision
// endpoints to contextual messages (RN-02, RN-03, RN-07, RN-19).
export interface AdditionalFindingErrorDetails {
  code: string | number;
  message: string;
}

export function translateAdditionalFindingError(
  error: unknown,
): AdditionalFindingErrorDetails {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return {
          code: 400,
          message:
            'Los datos enviados no son válidos. Revisa los campos e inténtalo de nuevo.',
        };
      case 401:
        return {
          code: 401,
          message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
        };
      case 403:
        return {
          code: 403,
          message:
            'Tu rol no tiene permisos para decidir sobre la ampliación de presupuesto.',
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
            'La orden no está esperando una decisión de ampliación o ya fue decidida.',
        };
      case 422:
        return {
          code: 422,
          message:
            'No hay stock suficiente para reservar los repuestos de la ampliación.',
        };
      default:
        return { code: error.statusCode, message: error.message };
    }
  }
  return {
    code: 'UNKNOWN',
    message: 'Error inesperado al decidir la ampliación de presupuesto. Inténtalo de nuevo.',
  };
}