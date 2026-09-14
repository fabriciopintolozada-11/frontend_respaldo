import { ApiError } from '../../../shared/api/httpClient';

// US-20 / FE-04: maps backend error codes to contextual messages for the
// settlement flow (RN-15, RN-16, RN-21).
export interface SettlementErrorDetails {
  code: string | number;
  message: string;
}

export function translateSettlementError(error: unknown): SettlementErrorDetails {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return {
          code: 400,
          message: 'Los datos enviados no son válidos. Revisa los campos e inténtalo de nuevo.',
        };
      case 403:
        return {
          code: 403,
          message: 'Tu rol no tiene permisos para realizar esta operación.',
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
            'La orden no está lista para entrega o ya fue entregada. No se pueden aplicar cambios.',
        };
      case 422:
        return {
          code: 422,
          message: 'El descuento supera el total disponible de la liquidación.',
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
    message: 'Error inesperado al procesar la liquidación. Inténtalo de nuevo.',
  };
}

export function translateDeliverError(error: unknown): SettlementErrorDetails {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return {
          code: 400,
          message: 'Los datos del pago no son válidos. Revisa el método y el comprobante.',
        };
      case 403:
        return {
          code: 403,
          message: 'Solo la recepcionista o el administrador pueden registrar la entrega.',
        };
      case 404:
        return {
          code: 404,
          message: 'La orden de trabajo no fue encontrada.',
        };
      case 409:
        return {
          code: 409,
          message: 'La orden no está lista para entrega o ya fue entregada.',
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
    message: 'Error inesperado al registrar la entrega. Inténtalo de nuevo.',
  };
}

export function translateSettlementLoadError(error: unknown): SettlementErrorDetails {
  if (error instanceof ApiError) {
    if (error.statusCode === 403) {
      return {
        code: 403,
        message: 'Tu rol no tiene permisos para visualizar la liquidación.',
      };
    }
    if (error.statusCode === 404) {
      return { code: 404, message: 'La orden de trabajo no fue encontrada.' };
    }
    if (error.statusCode === 409) {
      return {
        code: 409,
        message: 'La orden aún no está lista para entrega o ya fue entregada.',
      };
    }
    return {
      code: error.statusCode,
      message: 'No se pudo cargar la liquidación. Inténtalo de nuevo.',
    };
  }
  return {
    code: 'UNKNOWN',
    message: 'No se pudo cargar la liquidación. Inténtalo de nuevo.',
  };
}