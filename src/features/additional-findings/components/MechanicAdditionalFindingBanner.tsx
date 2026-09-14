import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

import type { AdditionalFindingStatus } from '../api/types';

interface MechanicAdditionalFindingBannerProps {
  status: AdditionalFindingStatus | undefined | null;
}

const BANNER_CONTENT: Record<
  Exclude<AdditionalFindingStatus, 'NONE'>,
  { title: string; description: string; classes: string; icon: ReactNode }
> = {
  PENDING_QUOTE: {
    title: 'Falla imprevista en espera de decisión',
    description:
      'Recepción debe aprobar o rechazar la ampliación de presupuesto antes de continuar.',
    classes: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />,
  },
  APPROVED: {
    title: 'Falla imprevista aprobada',
    description:
      'La ampliación fue autorizada por el cliente. Puedes intervenir la falla según lo reportado.',
    classes: 'border-lime-200 bg-lime-50 text-lime-900',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-lime-600" aria-hidden="true" />,
  },
  REJECTED: {
    title: 'Falla imprevista rechazada',
    description:
      'La reparación complementaria se omite por decisión del cliente. Concluye solo las tareas base aprobadas.',
    classes: 'border-red-200 bg-red-50 text-red-900',
    icon: <XCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />,
  },
};

// US-21 (FE-T21.3 / RN-16): the mechanic tablet reflects the reception decision
// of the last additional finding. Only the status string is shown — never a
// cost (RN-16 / BE-12). No mount: no annex -> no banner.
export function MechanicAdditionalFindingBanner({
  status,
}: MechanicAdditionalFindingBannerProps) {
  if (!status || status === 'NONE') return null;

  const content = BANNER_CONTENT[status];

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border p-4 ${content.classes}`}
    >
      {content.icon}
      <div>
        <p className="text-sm font-bold">{content.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-90">
          {content.description}
        </p>
      </div>
    </div>
  );
}