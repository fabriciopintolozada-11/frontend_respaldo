import {
  AlertTriangle,
  CheckCircle2,
  PackageX,
} from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { WorkOrderStatusBadge } from '../../../shared/components/Badge';

import { LaborChecklist } from './LaborChecklist';
import { PartsList } from './PartsList';

import type { AssignedWorkOrderDetail } from '../api/types';

interface AssignedOrderCardProps {
  order: AssignedWorkOrderDetail;
  onToggleLabor: (taskId: string) => void;
  onConfirmPart: (partId: string) => void;
  onFinalize: () => void;
  onReportAdditional: () => void;
  onSetAwaitingPart: () => void;
  isMutating: boolean;
}

function formatCode(id: string): string {
  return `OT-${id.slice(0, 8).toUpperCase()}`;
}

export function AssignedOrderCard({
  order,
  onToggleLabor,
  onConfirmPart,
  onFinalize,
  onReportAdditional,
  onSetAwaitingPart,
  isMutating,
}: AssignedOrderCardProps) {
  const isSuspended =
    order.status === 'EN_PROGRESO' &&
    order.statusHistory.some((historyEntry) =>
      historyEntry.reason?.includes('RN-03'),
    );

  const canSetAwaitingPart =
    order.status === 'EN_REPARACION';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 text-slate-900 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-lime-800 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-lg">
              {formatCode(order.id)}
            </span>

            <span className="font-mono font-extrabold text-base text-slate-950 break-all">
              {order.plate}
            </span>

            <span className="text-xs font-semibold text-slate-600 break-words">
              {order.vehicle.brand}{' '}
              {order.vehicle.model} ({order.vehicle.year})
            </span>
          </div>

          {order.assignedAt && (
            <p className="text-xs text-slate-600 mt-1">
              Asignada:{' '}
              <strong className="text-slate-950">
                {new Date(
                  order.assignedAt,
                ).toLocaleDateString()}
              </strong>
            </p>
          )}
        </div>

        <WorkOrderStatusBadge
          status={order.status as never}
        />
      </div>

      {isSuspended && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-1.5 h-10 bg-amber-500 rounded-full shrink-0 mt-0.5" />

          <div>
            <h4 className="font-bold text-sm text-slate-950">
              <span className="text-amber-800">ORDEN SUSPENDIDA - DAÑO ADICIONAL:</span>{' '}
              {order.initialComplaint}
            </h4>

            <p className="text-xs text-slate-600 mt-0.5">
              En pausa hasta la autorización del cliente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold block mb-1">
            Motivo de ingreso:
          </span>

          <p className="text-slate-950 font-medium">
            {order.initialComplaint}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold block mb-1">
            Diagnóstico técnico:
          </span>

          <p className="text-slate-950 font-medium">
            {order.diagnosticReport || 'Evaluación de bahía pendiente.'}
          </p>
        </div>
      </div>

      <LaborChecklist
        tasks={order.tasks}
        onToggle={onToggleLabor}
        isPending={isMutating}
      />

      <PartsList
        parts={order.parts}
        onConfirmInstalled={onConfirmPart}
        isPending={isMutating}
      />

      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="warning"
            size="md"
            leftIcon={<AlertTriangle className="w-5 h-5" />}
            onClick={onReportAdditional}
          >
            Reportar daño adicional
          </Button>

          {canSetAwaitingPart && (
            <Button
              variant="warning"
              size="md"
              leftIcon={<PackageX className="w-5 h-5" />}
              onClick={onSetAwaitingPart}
              disabled={isMutating}
            >
              En espera de repuesto
            </Button>
          )}
        </div>

        {(order.status === 'EN_PROGRESO' || order.status === 'APROBADO') && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
            onClick={onFinalize}
            disabled={isMutating}
          >
            Completar y enviar a control de calidad
          </Button>
        )}
      </div>
    </div>
  );
}
