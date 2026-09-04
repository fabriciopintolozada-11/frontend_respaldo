import { Package } from 'lucide-react';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import type { WorkOrderPart } from '../api/types';

interface PartsListProps {
  parts: WorkOrderPart[];
  onConfirmInstalled: (partId: string) => void;
  isPending: boolean;
}

export function PartsList({
  parts = [],
  onConfirmInstalled,
  isPending,
}: PartsListProps) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-lime-700" />
          Repuestos y materiales requeridos
        </h3>
      </div>

      {parts.length === 0 ? (
        <p className="text-xs text-slate-600 italic">
          No se solicitaron repuestos para esta orden.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {parts.map((part) => {
            const isInstalled = part.status === 'INSTALADO';

            return (
              <div
                key={part.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-lime-800">
                      {part.partCode}
                    </span>
                    <span className="text-sm font-bold text-slate-950">
                      x{part.quantityRequired} un.
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                    {part.description}
                  </p>
                </div>

                {isInstalled ? (
                  <Badge variant="success" size="md">
                    Instalado
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onConfirmInstalled(part.id)}
                    disabled={isPending}
                  >
                    Confirmar uso
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
