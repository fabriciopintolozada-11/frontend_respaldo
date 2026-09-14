import { useMemo, useState } from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import type { ReservedPart } from '../api/types';

interface ReservedPartsPanelProps {
  parts?: ReservedPart[] | null;
  workOrderId: string;
  canConsume: boolean;
  onConsume: (workOrderId: string, workOrderPartId: string, quantity: number) => void;
  isPending: boolean;
}

// HU-07 / FE-E08: recomputes the units still pending installation so a partial
// consume cannot exceed the remaining reservation (US-07 esc. 4).
function remainingQuantity(part: ReservedPart): number {
  return Math.max(0, part.quantityReserved - part.quantityUsed);
}

export function ReservedPartsPanel({
  parts,
  workOrderId,
  canConsume,
  onConsume,
  isPending,
}: ReservedPartsPanelProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const linedParts = useMemo(
    () =>
      (parts ?? []).map((part) => ({
        ...part,
        remaining: remainingQuantity(part),
      })),
    [parts],
  );

  if (linedParts.length === 0) {
    return (
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-lime-700" />
            Repuestos reservados
          </h3>
        </div>
        <p className="text-xs text-slate-600 italic">
          No hay repuestos reservados para esta orden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-lime-700" />
          Repuestos reservados
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {linedParts.map((part) => {
          const isInstalled = part.status === 'INSTALLED';
          const workOrderPartId = part.workOrderPartId?.trim()
            ? part.workOrderPartId
            : part.id;
          const selectedQty = quantities[workOrderPartId] ?? part.remaining;

          return (
            <div
              key={part.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-lime-800">
                    {part.code}
                  </span>
                  <span className="text-sm font-bold text-slate-950">
                    x{part.quantityReserved} un.
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                  {part.name}
                </p>
                {!isInstalled && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pendiente: {part.remaining} un.
                  </p>
                )}
              </div>

              {isInstalled ? (
                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Instalado</span>
                </div>
              ) : canConsume ? (
                <div className="flex items-center gap-2 shrink-0">
                  <label
                    htmlFor={`qty-${workOrderPartId}`}
                    className="sr-only"
                  >
                    Cantidad a instalar
                  </label>
                  <input
                    id={`qty-${workOrderPartId}`}
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
                        [workOrderPartId]: value,
                      }));
                    }}
                    className="w-20 rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900 text-center min-h-[44px] focus:outline-none focus:border-lime-600"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isPending}
                    onClick={() =>
                      onConsume(workOrderId, workOrderPartId, selectedQty)
                    }
                    disabled={isPending}
                  >
                    Confirmar uso
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-500">
                  En espera de aprobación
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}