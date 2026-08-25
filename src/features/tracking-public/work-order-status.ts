export const WORK_ORDER_STATUS_ORDER = [
  'RECIBIDO',
  'EN_DIAGNOSTICO',
  'PRESUPUESTO_ENVIADO',
  'APROBADO',
  'EN_REPARACION',
  'LISTO',
  'ENTREGADO',
] as const;

export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PRESUPUESTO_ENVIADO: 'Presupuesto enviado',
  APROBADO: 'Aprobado',
  EN_REPARACION: 'En reparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
};

const LEGACY_STATUS_MAP: Record<string, (typeof WORK_ORDER_STATUS_ORDER)[number]> = {
  ASIGNADA: 'EN_DIAGNOSTICO',
  ESPERANDO_REPUESTO: 'EN_REPARACION',
  FINALIZADO: 'LISTO',
  LISTO_ENTREGA: 'LISTO',
};

export const FINALIZED_STATUSES = ['LISTO', 'ENTREGADO', 'FINALIZADO', 'LISTO_ENTREGA'] as const;

export function normalizeWorkOrderStatus(status: string): (typeof WORK_ORDER_STATUS_ORDER)[number] | null {
  const normalizedStatus = LEGACY_STATUS_MAP[status] ?? status;
  return (WORK_ORDER_STATUS_ORDER as readonly string[]).includes(normalizedStatus)
    ? (normalizedStatus as (typeof WORK_ORDER_STATUS_ORDER)[number])
    : null;
}

export function isFinished(status: string): boolean {
  return (FINALIZED_STATUSES as readonly string[]).includes(status);
}
