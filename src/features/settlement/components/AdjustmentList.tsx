import { BadgeX, RotateCcw } from 'lucide-react';

import type { SettlementAdjustmentSummary } from '../api/settlement.types';
import { isDiscountActive } from '../lib/adjustments';
import { formatBoB } from '../lib/money';

interface AdjustmentListProps {
  adjustments: SettlementAdjustmentSummary[];
  // RN-15 / FE-18: only WORKSHOP_LEAD may void discounts.
  canVoid: boolean;
  onVoid: (adjustment: SettlementAdjustmentSummary) => void;
}

// US-20 / RN-15: immutable history of settlement adjustments (audit trail).
// A VOID record never deletes the original DISCOUNT; it counteracts it.
export function AdjustmentList({ adjustments, canVoid, onVoid }: AdjustmentListProps) {
  if (adjustments.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-sm text-slate-500">Todavía no hay descuentos registrados.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-lime-700" aria-hidden="true" />
          <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900">
            Descuentos y anulaciones
          </h2>
        </div>
        {canVoid && (
          <span className="text-[11px] font-semibold text-slate-500">
            Solo jefe de taller puede anular
          </span>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {adjustments.map((adjustment, index) => {
          const active =
            adjustment.type === 'DISCOUNT' && isDiscountActive(adjustments, index);
          return (
            <li
              key={adjustment.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {adjustment.type === 'DISCOUNT' ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      Descuento
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                      Anulación
                    </span>
                  )}
                  <span className="font-mono text-sm font-extrabold text-slate-900">
                    {formatBoB(adjustment.amount)}
                  </span>
                  {adjustment.type === 'DISCOUNT' && !active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      Anulado
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {adjustment.reason || 'Sin motivo registrado'}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  {new Date(adjustment.createdAt).toLocaleString('es-BO', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              {canVoid && active && (
                <button
                  type="button"
                  onClick={() => onVoid(adjustment)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 hover:border-red-300"
                >
                  <BadgeX className="h-4 w-4" aria-hidden="true" />
                  Anular
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}