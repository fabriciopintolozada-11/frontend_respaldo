import {
  FileText,
  RefreshCw,
} from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { WorkOrderStatusBadge } from '../../../shared/components/Badge';

import { useAssignedOrderDetail } from '../hooks/useAssignedOrders';
import { ReservedPartsPanel } from './ReservedPartsPanel';

import type { AssignedWorkOrderSummary, ReservedPartDetail } from '../api/types';

const DIAGNOSTIC_ELIGIBLE = ['RECIBIDO', 'ASIGNADA', 'EN_DIAGNOSTICO', 'EN_REPARACION'];

// RN-09: a reserved spare part can only be consumed from an approved quote
// once the order is approved or in repair.
const CONSUME_ELIGIBLE = ['APROBADO', 'EN_REPARACION'];

function isStatusIn(status: string | undefined, allowed: string[]): boolean {
  return Boolean(status && allowed.includes(status.toUpperCase()));
}

interface AssignedOrderCardProps {
  order: AssignedWorkOrderSummary;
  onConsumePart: (workOrderId: string, quotePartId: string, quantity: number) => void;
  onDiagnose: (order: AssignedWorkOrderSummary) => void;
  isMutating: boolean;
}

function formatCode(id: string): string {
  return `OT-${id.slice(0, 8).toUpperCase()}`;
}

// HU-07: maps the backend ReservedPartDetail line to the ReservedPart the
// panel consumes. quotePartId is the identifier the consume-part endpoint needs.
function mapToReservedPart(part: ReservedPartDetail) {
  return {
    id: part.quotePartId,
    quotePartId: part.quotePartId,
    code: part.code,
    name: part.name,
    quantityReserved: part.quantityReserved,
    quantityUsed: part.quantityUsed,
    status: part.status,
  };
}

export function AssignedOrderCard({
  order,
  onConsumePart,
  onDiagnose,
  isMutating,
}: AssignedOrderCardProps) {
  const detailQuery = useAssignedOrderDetail(order.id);
  const detail = detailQuery.data;

  // HU-07: the reserved parts are exposed by the backend in the detail
  // response (RN-16: no financial fields). When the backend has none, the
  // panel shows the informative unavailable state (never live mock data).
  const reservedParts = detail?.reservedParts?.length
    ? detail.reservedParts.map(mapToReservedPart)
    : undefined;

  const canConsume = isStatusIn(detail?.status, CONSUME_ELIGIBLE);

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
              {detail ? (
                <>
                  {[detail.brand, detail.model].filter(Boolean).join(' ')}
                  {detail.year ? ` (${detail.year})` : ''}
                </>
              ) : (
                'Cargando vehículo…'
              )}
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
            Estado técnico:
          </span>

          <p className="text-slate-950 font-medium">
            {detail?.status ?? 'Cargando detalle…'}
          </p>
        </div>
      </div>

      {detailQuery.isPending && (
        <p className="text-xs text-slate-600 italic">
          Cargando repuestos reservados…
        </p>
      )}

      {detailQuery.isError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-center justify-between gap-3">
          <span>No se pudieron cargar los repuestos reservados.</span>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => detailQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      )}

      {detail && (
        <ReservedPartsPanel
          parts={reservedParts}
          workOrderId={order.id}
          canConsume={canConsume}
          onConsume={onConsumePart}
          isPending={isMutating}
        />
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {isStatusIn(order.status, DIAGNOSTIC_ELIGIBLE) && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<FileText className="w-5 h-5" />}
              onClick={() => onDiagnose(order)}
              disabled={isMutating}
            >
              Registrar diagnóstico
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}