import { useState } from 'react';
import { CheckCircle2, Package, Info } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';

// HU-07 / RN-16: the reserved-spare-part line exposed to the UI. Financial
// fields are optional on purpose: when the consumer is a MECHANIC they must
// be undefined so no price is ever rendered (FE-T07.3).
export interface ReservedPartLine {
  quotePartId: string;
  id: string;
  code: string;
  name: string;
  reservedQuantity: number;
  usedQuantity: number;
  status: string;
  unitPriceBOB?: number;
}

export type ReservedPartsViewerRole = 'MECHANIC' | 'WORKSHOP_LEAD';

interface ReservedPartsPanelProps {
  parts: ReservedPartLine[] | null | undefined;
  userRole: ReservedPartsViewerRole | string;
  onConfirm: (part: ReservedPartLine, quantity: number) => Promise<void> | void;
  isPending?: boolean;
  pendingPartId?: string | null;
}

function remainingQuantity(part: ReservedPartLine): number {
  return Math.max(0, part.reservedQuantity - part.usedQuantity);
}

// HU-07 / FE-T07.1: tactile panel where a mechanic confirms the installation
// of reserved spare parts. When the source data is unavailable (null/undefined)
// because the backend does not yet expose it for the assigned work order, an
// informative empty state is rendered (no mock data is ever used).
export function ReservedPartsPanel({
  parts,
  userRole,
  onConfirm,
  isPending = false,
  pendingPartId = null,
}: ReservedPartsPanelProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // RN-16: only WORKSHOP_LEAD (or ADMIN) may see prices. Any other role is
  // treated as a mechanic and prices are hidden both from state and render.
  const canSeePrices = userRole === 'WORKSHOP_LEAD';

  // The backend does not yet expose the reserved parts for an assigned work
  // order. Under no circumstance do we fabricate local data: we communicate
  // that the information is pending until the backend endpoint is available.
  if (parts === null || parts === undefined) {
    return (
      <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#F97316]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Repuestos reservados
          </h3>
        </div>
        <p className="text-xs text-slate-600 italic">
          Las unidades reservadas para esta orden se mostrarán aquí cuando estén
          disponibles desde el backend.
        </p>
      </Card>
    );
  }

  const reserved = parts
    .map((part) => ({ ...part, remaining: remainingQuantity(part) }))
    .filter((part) => part.remaining > 0);

  if (reserved.length === 0) {
    return (
      <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-[#F97316]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Repuestos reservados
          </h3>
        </div>
        <p className="text-xs text-slate-600 italic">
          No hay repuestos reservados pendientes de instalación para esta orden.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md" className="!bg-white !text-slate-900 !border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#F97316]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Repuestos reservados para instalar
          </h3>
        </div>
        <span className="text-[10px] text-slate-600">{reserved.length} pendientes</span>
      </div>

      <div className="space-y-2">
        {reserved.map((part) => {
          const isPartPending = isPending && pendingPartId === part.quotePartId;
          const selectedQty = quantities[part.quotePartId] ?? part.remaining;

          return (
            <div
              key={part.quotePartId}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#F97316]">
                    {part.code}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 break-words">
                    {part.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                  <span>
                    Pendiente: <strong className="text-slate-900">{part.remaining} un.</strong>
                  </span>
                  {/* RN-16 / FE-T07.3: prices are only rendered for WORKSHOP_LEAD */}
                  {canSeePrices && part.unitPriceBOB !== undefined && (
                    <Badge variant="success" className="!bg-emerald-50 !text-emerald-700 !border-emerald-200">
                      {part.unitPriceBOB.toLocaleString('es-BO')} Bs./un.
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label
                    htmlFor={`qty-${part.quotePartId}`}
                    className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    Cantidad a instalar
                  </label>
                  <input
                    id={`qty-${part.quotePartId}`}
                    type="number"
                    min={1}
                    max={part.remaining}
                    value={selectedQty}
                    onChange={(e) => {
                      const value = Math.min(
                        part.remaining,
                        Math.max(1, Number(e.target.value) || 1),
                      );
                      setQuantities((prev) => ({
                        ...prev,
                        [part.quotePartId]: value,
                      }));
                    }}
                    className="w-20 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 text-center min-h-[44px] focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* FE-T07.1: tactile accessible action, min 44x44 px */}
              <Button
                variant="primary"
                size="sm"
                className="shrink-0"
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
                isLoading={isPartPending}
                disabled={isPending && !isPartPending}
                onClick={() => onConfirm(part, selectedQty)}
              >
                Confirmar uso
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
