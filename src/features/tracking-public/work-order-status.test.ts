import { describe, expect, it } from 'vitest';

import {
  normalizePublicStatus,
  PUBLIC_STATUS_LABELS,
  PUBLIC_STATUS_ORDER,
} from './work-order-status';

describe('normalizePublicStatus (US-17)', () => {
  it('keeps canonical active statuses unchanged', () => {
    expect(normalizePublicStatus('RECIBIDO')).toBe('RECIBIDO');
    expect(normalizePublicStatus('EN_DIAGNOSTICO')).toBe('EN_DIAGNOSTICO');
    expect(normalizePublicStatus('PRESUPUESTO_ENVIADO')).toBe('PRESUPUESTO_ENVIADO');
    expect(normalizePublicStatus('APROBADO')).toBe('APROBADO');
    expect(normalizePublicStatus('EN_REPARACION')).toBe('EN_REPARACION');
    expect(normalizePublicStatus('LISTO_ENTREGA')).toBe('LISTO_ENTREGA');
  });

  it('groups internal statuses into their public stage (RN-16/RN-17)', () => {
    expect(normalizePublicStatus('ASIGNADA')).toBe('EN_DIAGNOSTICO');
    expect(normalizePublicStatus('EN_ESPERA_DE_REPUESTO')).toBe('EN_REPARACION');
    expect(normalizePublicStatus('ESPERANDO_REPUESTO')).toBe('EN_REPARACION');
    expect(normalizePublicStatus('FINALIZADO')).toBe('LISTO_ENTREGA');
  });

  it('returns null for terminal/unknown statuses so nothing leaks', () => {
    expect(normalizePublicStatus('ENTREGADO')).toBeNull();
    expect(normalizePublicStatus('RECHAZADO')).toBeNull();
    expect(normalizePublicStatus('CANCELADA')).toBeNull();
    expect(normalizePublicStatus('DESCONOCIDO')).toBeNull();
  });

  it('exposes ordered, labeled public stages', () => {
    expect(PUBLIC_STATUS_ORDER).toEqual([
      'RECIBIDO',
      'EN_DIAGNOSTICO',
      'PRESUPUESTO_ENVIADO',
      'APROBADO',
      'EN_REPARACION',
      'LISTO_ENTREGA',
    ]);
    expect(PUBLIC_STATUS_LABELS.EN_REPARACION).toBe('En reparación');
    expect(PUBLIC_STATUS_LABELS.LISTO_ENTREGA).toBe('Listo para entrega');
  });
});