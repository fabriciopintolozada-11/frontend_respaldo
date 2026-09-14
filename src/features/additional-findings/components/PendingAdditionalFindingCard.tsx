import type { ReactNode } from 'react';
import { AlertTriangle, CarFront, CheckCircle2, Clock3, MapPin, Phone, XCircle } from 'lucide-react';

import { ContactCustomer } from '../../stale-quotes/components/ContactCustomer';
import type { TrackingOrder } from '../../work-orders/api/tracking-api';

// Context opened from the pending card to feed the resolve modal (FE-T21.2).
export interface AdditionalFindingResolveContext {
  id: string;
  plate: string;
  findingDescription: string | null;
}

interface PendingAdditionalFindingCardProps {
  order: TrackingOrder;
  onResolve: (context: AdditionalFindingResolveContext) => void;
  onViewHistory: (plate: string) => void;
}

// US-21 (FE-T21.1 / RN-03): the reception board highlights orders suspended in
// PRESUPUESTO_ENVIADO because of an unforeseen finding. The card shows the
// plate, the mechanic description and the direct customer contact, plus the
// decision actions (FE-T21.2). No monetary value is shown (RN-16).
export function PendingAdditionalFindingCard({
  order,
  onResolve,
  onViewHistory,
}: PendingAdditionalFindingCardProps) {
  const context: AdditionalFindingResolveContext = {
    id: order.id,
    plate: order.plate,
    findingDescription: order.additionalFindingDescription ?? null,
  };

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 bg-amber-50 px-5 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
          Ampliación de Presupuesto Pendiente
        </span>
        <span className="text-xs font-semibold text-amber-800">
          Requiere autorización expresa del cliente para continuar
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-extrabold tracking-wide text-slate-900">
                {order.plate}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                Presupuesto enviado
              </span>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <CarFront className="h-4 w-4" aria-hidden="true" />
              {order.model}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ContactCustomer phone={order.customerPhone ?? undefined} />
            <button
              type="button"
              onClick={() => onViewHistory(order.plate)}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-lime-500 hover:bg-lime-50"
            >
              Ver expediente histórico
            </button>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem icon={<MapPin className="h-4 w-4" />} label="Bahía" value={order.bayNumber ? `Bahía ${order.bayNumber}` : 'Sin asignar'} />
          <InfoItem icon={<Phone className="h-4 w-4" />} label="Mecánico" value={order.mechanicName ?? 'Sin asignar'} />
          <InfoItem icon={<Clock3 className="h-4 w-4" />} label="Permanencia" value={`${order.daysInWorkshop} ${order.daysInWorkshop === 1 ? 'día' : 'días'}`} />
          <InfoItem icon={<AlertTriangle className="h-4 w-4" />} label="Hallazgo" value="Falla imprevista" />
        </dl>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Daño imprevisto reportado por el mecánico
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-950">
            {order.additionalFindingDescription ?? 'Sin descripción del hallazgo.'}
          </p>
          {order.customerPhone && (
            <p className="mt-2 text-xs font-semibold text-amber-800">
              Teléfono del cliente:{' '}
              <span className="font-mono">{order.customerPhone}</span>
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => onResolve(context)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-sm font-bold text-lime-950 shadow-sm transition hover:bg-lime-300"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Aprobar Ampliación
          </button>
          <button
            type="button"
            onClick={() => onResolve(context)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Rechazar y Continuar Reparación Base
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}