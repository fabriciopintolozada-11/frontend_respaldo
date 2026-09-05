import { CheckCircle2, Package } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import type { ReservedPart } from '../api/types';

interface ReservedPartsPanelProps {
  parts?: ReservedPart[] | null;
  workOrderId: string;
  canConsume: boolean;
  onConsume: (workOrderId: string, quotePartId: string, quantity: number) => void;
  isPending: boolean;
}

export function ReservedPartsPanel({
  parts,
  workOrderId,
  canConsume,
  onConsume,
  isPending,
}: ReservedPartsPanelProps) {
  const safeParts = parts ?? [];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-lime-700" />
          Repuestos reservados
        </h3>
      </div>

      {safeParts.length === 0 ? (
        <p className="text-xs text-slate-600 italic">
          No hay repuestos reservados para esta orden.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {safeParts.map((part) => {
            const isInstalled = part.status === 'INSTALLED';

            return (
              <div
                key={part.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-lime-800">
                      {part.code || '—'}
                    </span>
                    <span className="text-sm font-bold text-slate-950">
                      x{part.quantityReserved ?? 0} un.
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                    {part.name || 'Sin nombre'}
                  </p>
                </div>

                {isInstalled ? (
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Instalado</span>
                  </div>
                ) : canConsume ? (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isPending}
                    onClick={() =>
                      onConsume(
                        workOrderId,
                        part.quotePartId,
                        part.quantityReserved,
                      )
                    }
                    disabled={isPending}
                  >
                    Confirmar uso
                  </Button>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    En espera de aprobación
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}