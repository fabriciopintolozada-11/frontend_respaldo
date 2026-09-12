import { AlertTriangle, CarFront, Clock3, DollarSign, Flag, MapPin, Phone, UserRound, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

import type { components } from '../../../shared/api/schema.gen';

type TrackingOrder = components['schemas']['WorkOrderTrackingResponseDto'];

interface WorkOrderTrackingCardProps {
  order: TrackingOrder;
  onViewHistory: (plate: string) => void;
  // US-19: when provided (WORKSHOP_LEAD only, FE-18), the card shows the
  // "Concluir Reparación" action for orders in EN_REPARACION (BE-T19.2).
  onComplete?: (orderId: string) => void;
  // US-20: when provided (RECEPTIONIST / WORKSHOP_LEAD / ADMIN, FE-18), the
  // card shows the "Liquidar Cuenta" action for orders in LISTO_ENTREGA.
  onSettle?: (orderId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  RECIBIDO: 'Recibido',
  ASIGNADA: 'Asignada',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PRESUPUESTO_ENVIADO: 'Presupuesto enviado',
  APROBADO: 'Aprobado',
  EN_REPARACION: 'En reparación',
  EN_ESPERA_DE_REPUESTO: 'En espera de repuesto',
  LISTO_ENTREGA: 'Listo para entrega',
  ENTREGADO: 'Entregado',
  FINALIZADO: 'Finalizado',
};

const STATUS_STYLES: Record<string, string> = {
  RECIBIDO: 'bg-slate-100 text-slate-700',
  ASIGNADA: 'bg-blue-100 text-blue-700',
  EN_DIAGNOSTICO: 'bg-violet-100 text-violet-700',
  PRESUPUESTO_ENVIADO: 'bg-amber-100 text-amber-800',
  APROBADO: 'bg-emerald-100 text-emerald-700',
  EN_REPARACION: 'bg-lime-100 text-lime-800',
  EN_ESPERA_DE_REPUESTO: 'bg-orange-100 text-orange-800',
  LISTO_ENTREGA: 'bg-cyan-100 text-cyan-800',
  ENTREGADO: 'bg-slate-100 text-slate-700',
  FINALIZADO: 'bg-slate-100 text-slate-700',
};

export function WorkOrderTrackingCard({ order, onViewHistory, onComplete, onSettle }: WorkOrderTrackingCardProps) {
  const isPaused = Boolean(order.missingPartName || order.pausedReason);
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const statusStyle = STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-700';
  const canComplete = Boolean(onComplete) && order.status === 'EN_REPARACION';
  const canSettle = Boolean(onSettle) && order.status === 'LISTO_ENTREGA';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-extrabold tracking-wide text-slate-900">{order.plate}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle}`}>{statusLabel}</span>
            {order.isStaleQuote && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                15+ días sin respuesta
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <CarFront className="h-4 w-4" aria-hidden="true" />
            {order.model}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canComplete && onComplete && (
            <button
              type="button"
              onClick={() => onComplete(order.id)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-lime-950 shadow-sm transition hover:bg-lime-300"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              Concluir Reparación
            </button>
          )}
          {canSettle && onSettle && (
            <button
              type="button"
              onClick={() => onSettle(order.id)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-bold text-lime-950 shadow-sm transition hover:bg-lime-300"
            >
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Liquidar Cuenta
            </button>
          )}
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
        <InfoItem icon={<Wrench className="h-4 w-4" />} label="Mecánico" value={order.mechanicName ?? 'Sin asignar'} />
        <InfoItem icon={<Clock3 className="h-4 w-4" />} label="Permanencia" value={`${order.daysInWorkshop} ${order.daysInWorkshop === 1 ? 'día' : 'días'}`} />
        <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono cliente" value={order.customerPhone ?? 'No registrado'} />
      </dl>

      {isPaused && (
        <div className="mt-5 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900" role="status">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Orden detenida</p>
            {order.missingPartName && <p className="mt-1 text-sm">Repuesto faltante: {order.missingPartName}</p>}
            {order.pausedReason && <p className="mt-1 text-sm">Motivo: {order.pausedReason}</p>}
            {order.daysWaitingApproval !== null && (
              <p className="mt-1 text-sm">Días esperando aprobación: {order.daysWaitingApproval}</p>
            )}
          </div>
        </div>
      )}
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
      <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {label === 'Mecánico' && <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}
