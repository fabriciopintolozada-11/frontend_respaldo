import { AlertTriangle, Car, ClipboardList, Clock, User, Wrench } from 'lucide-react';

import type { WorkBayMonitoring } from '../api/types';

export type BayUiStatus = 'DISPONIBLE' | 'EN_DIAGNOSTICO' | 'EN_REPARACION' | 'EN_ESPERA_DE_REPUESTO';

export interface BayStatusStyle {
  label: string;
  badge: string;
  border: string;
  dot: string;
  panel: string;
}

export const BAY_STATUS_STYLES: Record<BayUiStatus, BayStatusStyle> = {
  DISPONIBLE: {
    label: 'Disponible',
    badge: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    panel: 'bg-slate-50',
  },
  EN_DIAGNOSTICO: {
    label: 'En Diagnóstico',
    badge: 'bg-[#3B82F615] text-[#3B82F6] border border-[#3B82F630]',
    border: 'border-[#3B82F630]',
    dot: 'bg-[#3B82F6]',
    panel: 'bg-[#3B82F608]',
  },
  EN_REPARACION: {
    label: 'En Reparación',
    badge: 'bg-[#22C55E15] text-[#22C55E] border border-[#22C55E30]',
    border: 'border-[#22C55E30]',
    dot: 'bg-[#22C55E]',
    panel: 'bg-[#22C55E08]',
  },
  EN_ESPERA_DE_REPUESTO: {
    label: 'En Espera de Repuesto',
    badge: 'bg-[#F59E0B15] text-[#F59E0B] border border-[#F59E0B30]',
    border: 'border-[#F59E0B40]',
    dot: 'bg-[#F59E0B]',
    panel: 'bg-[#F59E0B08]',
  },
};

function toUiStatus(bay: WorkBayMonitoring): BayUiStatus {
  switch (bay.status) {
    case 'LIBRE':
      return 'DISPONIBLE';
    case 'ESPERA_REPUESTO':
      return 'EN_ESPERA_DE_REPUESTO';
    case 'MANTENIMIENTO':
      return 'EN_REPARACION';
    case 'OCUPADA':
    default:
      return bay.currentWorkOrder?.status === 'EN_DIAGNOSTICO' ? 'EN_DIAGNOSTICO' : 'EN_REPARACION';
  }
}

function vehicleDescription(bay: WorkBayMonitoring): string | null {
  const brand = bay.currentWorkOrder?.vehicleBrand?.trim();
  const model = bay.currentWorkOrder?.vehicleModel?.trim();
  if (!brand && !model) return null;
  return [brand, model].filter(Boolean).join(' ');
}

function hasOccupationDetail(bay: WorkBayMonitoring): boolean {
  const workOrder = bay.currentWorkOrder;
  return Boolean(
    workOrder?.plate ||
      workOrder?.vehicleBrand ||
      workOrder?.vehicleModel ||
      workOrder?.mechanicName ||
      workOrder?.status ||
      typeof workOrder?.elapsedHours === 'number',
  );
}

export function WorkBayCard({ bay }: { bay: WorkBayMonitoring }) {
  const uiStatus = toUiStatus(bay);
  const style = BAY_STATUS_STYLES[uiStatus];
  const isAvailable = uiStatus === 'DISPONIBLE';
  const isWaiting = uiStatus === 'EN_ESPERA_DE_REPUESTO';
  const workOrder = bay.currentWorkOrder;
  const vehicle = vehicleDescription(bay);

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 ${style.border}`}>
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
          <div className="min-w-0">
            <h3 className="truncate font-mono text-sm font-extrabold text-slate-900">Bahía {bay.bayNumber}</h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">Bahía física {bay.bayNumber}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${style.badge}`}>
          {style.label}
        </span>
      </header>

      {isAvailable ? (
        <div className={`rounded-xl border border-slate-200 py-6 text-center ${style.panel}`}>
          <Wrench className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-700">Disponible</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Lista para recibir una OT</p>
        </div>
      ) : (
        <>
          <div className={`space-y-2 rounded-xl p-3 text-xs ${style.panel}`}>
            {workOrder?.plate && (
              <div className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-mono font-bold text-slate-900">{workOrder.plate}</span>
              </div>
            )}
            {vehicle && <p className="text-slate-600">{vehicle}</p>}
            {workOrder?.mechanicName && (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="text-slate-700">{workOrder.mechanicName}</span>
              </div>
            )}
            {workOrder?.status && (
              <div className="flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="font-semibold text-slate-800">OT: {workOrder.status}</span>
              </div>
            )}
            {typeof workOrder?.elapsedHours === 'number' && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="text-slate-700">{workOrder.elapsedHours} h en etapa</span>
              </div>
            )}
            {!hasOccupationDetail(bay) && (
              <p className="text-slate-500">Ocupada - sin detalle disponible del backend</p>
            )}
          </div>

          {isWaiting && (
            <div className="rounded-xl border border-[#F59E0B30] bg-[#F59E0B10] p-3 text-xs text-amber-800">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                Espera de repuesto
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}