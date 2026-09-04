import { Check, CircleAlert, Clock3, Package, Wrench } from 'lucide-react';

import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';
import type { BudgetItem } from '../api/useBudgetApproval';

interface BudgetItemsTableProps {
  items: BudgetItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
}

const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} BOB`;
}

export function BudgetItemsTable({ items = [], selectedItemIds = [], onToggleItem, onToggleAll }: BudgetItemsTableProps) {
  const selectableItems = items.filter((item) => !item.isElectricRestricted);
  const allSelected = selectableItems.length > 0 && selectableItems.every((item) => selectedItemIds.includes(item.id));

  return (
    <Card variant="public" padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Ítems del presupuesto</h2>
          <p className="mt-1 text-xs text-slate-500">Selecciona los repuestos y servicios que el cliente autoriza.</p>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          disabled={selectableItems.length === 0}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-lime-500 hover:text-lime-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded border ${allSelected ? 'border-lime-600 bg-lime-400 text-lime-950' : 'border-slate-400'}`}>
            {allSelected && <Check className="h-3.5 w-3.5" />}
          </span>
          {allSelected ? 'Quitar selección' : 'Seleccionar autorizables'}
        </button>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-16 px-5 py-3">Autorizar</th>
              <th className="px-3 py-3">Concepto</th>
              <th className="px-3 py-3">Cantidad</th>
              <th className="px-3 py-3">Unitario</th>
              <th className="px-5 py-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <tr key={item.id} className={item.isElectricRestricted ? 'bg-amber-50/60' : isSelected ? 'bg-lime-50/60' : 'bg-white'}>
                  <td className="px-5 py-3 align-top">
                    <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleItem(item.id)}
                        disabled={item.isElectricRestricted}
                        aria-label={`Autorizar ${item.description}`}
                        className="h-5 w-5 accent-lime-500 disabled:cursor-not-allowed"
                      />
                    </label>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 rounded-lg p-1.5 ${item.type === 'part' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                        {item.type === 'part' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{item.description}</p>
                        <p className="mt-1 font-mono text-[10px] text-slate-500">{item.code ?? 'MANO-DE-OBRA'} · {item.status}</p>
                        {item.isElectricRestricted && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <CircleAlert className="h-3.5 w-3.5" /> No autorizado para vehículo eléctrico
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top font-mono text-slate-600">{item.quantity}</td>
                  <td className="px-3 py-3 align-top font-mono text-slate-600">{formatMoney(item.unitPriceBOB)}</td>
                  <td className="px-5 py-3 text-right align-top font-mono font-extrabold text-slate-900">{formatMoney(item.totalBOB)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          return (
            <div key={item.id} className={`rounded-xl border p-3 ${item.isElectricRestricted ? 'border-amber-200 bg-amber-50' : isSelected ? 'border-lime-300 bg-lime-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start gap-3">
                <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleItem(item.id)}
                    disabled={item.isElectricRestricted}
                    aria-label={`Autorizar ${item.description}`}
                    className="h-5 w-5 accent-lime-500 disabled:cursor-not-allowed"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold leading-snug text-slate-800">{item.description}</p>
                    <span className="shrink-0 font-mono text-sm font-extrabold text-slate-900">{formatMoney(item.totalBOB)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={item.type === 'part' ? 'info' : 'purple'} size="sm">{item.type === 'part' ? 'Repuesto' : 'Servicio'}</Badge>
                    <span className="text-xs text-slate-500">{item.quantity} × {formatMoney(item.unitPriceBOB)}</span>
                  </div>
                  {item.isElectricRestricted && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-700"><CircleAlert className="h-3.5 w-3.5" /> Bloqueado por RN-18</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="flex min-h-32 items-center justify-center gap-2 p-5 text-sm text-slate-500">
          <Clock3 className="h-4 w-4" /> No hay ítems para revisar.
        </div>
      )}
    </Card>
  );
}
