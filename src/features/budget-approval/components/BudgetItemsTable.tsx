import { Clock3, Package, Wrench } from 'lucide-react';

import { Badge } from '../../../shared/components/Badge';
import { Card } from '../../../shared/components/Card';
import type { QuoteApprovalItem } from '../api/useBudgetApproval';

interface BudgetItemsTableProps {
  items: QuoteApprovalItem[];
}

const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: string | number): string {
  return `${moneyFormatter.format(Number(amount))} BOB`;
}

function itemLabel(item: QuoteApprovalItem): string {
  return item.itemType === 'PART' ? 'Repuesto' : 'Servicio';
}

export function BudgetItemsTable({ items = [] }: BudgetItemsTableProps) {
  return (
    <Card variant="public" padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-extrabold text-slate-900">Ítems del presupuesto</h2>
        <p className="text-xs text-slate-500">Detalle autorizado por la cotización. La aprobación o rechazo aplica al presupuesto completo.</p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Concepto</th>
              <th className="px-3 py-3">Código</th>
              <th className="px-3 py-3">Cantidad</th>
              <th className="px-3 py-3">Unitario</th>
              <th className="px-5 py-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="bg-white">
                <td className="px-5 py-3 align-top">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 rounded-lg p-1.5 ${item.itemType === 'PART' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                      {item.itemType === 'PART' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{item.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={item.itemType === 'PART' ? 'info' : 'purple'} size="sm">{itemLabel(item)}</Badge>
                        <span className="font-mono text-[10px] text-slate-500">{item.status}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-top font-mono text-xs text-slate-500">{item.code ?? '—'}</td>
                <td className="px-3 py-3 align-top font-mono text-slate-600">{item.quantity}</td>
                <td className="px-3 py-3 align-top font-mono text-slate-600">{formatMoney(item.unitPrice)}</td>
                <td className="px-5 py-3 text-right align-top font-mono font-extrabold text-slate-900">{formatMoney(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold leading-snug text-slate-800">{item.description}</p>
              <span className="shrink-0 font-mono text-sm font-extrabold text-slate-900">{formatMoney(item.subtotal)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={item.itemType === 'PART' ? 'info' : 'purple'} size="sm">{itemLabel(item)}</Badge>
              {item.code && <span className="font-mono text-[10px] text-slate-500">{item.code}</span>}
              <span className="text-xs text-slate-500">{item.quantity} × {formatMoney(item.unitPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex min-h-32 items-center justify-center gap-2 p-5 text-sm text-slate-500">
          <Clock3 className="h-4 w-4" /> No hay ítems para revisar.
        </div>
      )}
    </Card>
  );
}