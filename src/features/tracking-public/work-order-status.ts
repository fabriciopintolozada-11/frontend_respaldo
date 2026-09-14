// US-17: etapas visibles en el portal público. El backend solo devuelve estados
// operativos activos (los terminales resuelven a 404 por RN-17), por lo que el
// cliente ve este recorrido simplificado.
export const PUBLIC_STATUS_ORDER = [
  'RECIBIDO',
  'EN_DIAGNOSTICO',
  'PRESUPUESTO_ENVIADO',
  'APROBADO',
  'EN_REPARACION',
  'LISTO_ENTREGA',
] as const;

export type PublicStatus = (typeof PUBLIC_STATUS_ORDER)[number];

export const PUBLIC_STATUS_LABELS: Record<PublicStatus, string> = {
  RECIBIDO: 'Recibido',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PRESUPUESTO_ENVIADO: 'Presupuesto',
  APROBADO: 'Presupuesto aprobado',
  EN_REPARACION: 'En reparación',
  LISTO_ENTREGA: 'Listo para entrega',
};

// Estados internos que se agrupan en una etapa pública equivalente.
const PUBLIC_STATUS_ALIASES: Record<string, PublicStatus> = {
  ASIGNADA: 'EN_DIAGNOSTICO',
  EN_ESPERA_DE_REPUESTO: 'EN_REPARACION',
  ESPERANDO_REPUESTO: 'EN_REPARACION',
  FINALIZADO: 'LISTO_ENTREGA',
  LISTO_ENTREGA: 'LISTO_ENTREGA',
};

export function normalizePublicStatus(status: string): PublicStatus | null {
  const normalized = PUBLIC_STATUS_ALIASES[status] ?? status;
  return (PUBLIC_STATUS_ORDER as readonly string[]).includes(normalized)
    ? (normalized as PublicStatus)
    : null;
}
