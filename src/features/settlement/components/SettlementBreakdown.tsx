import { ReceiptText, Wrench } from 'lucide-react';

import type { SettlementResponse } from '../api/settlement.types';
import { formatBoB } from '../lib/money';

interface SettlementBreakdownProps {
  settlement: SettlementResponse;
}

// US-20: full breakdown of the consolidated settlement (RN-21). All monetary
// values are backend strings with 2 decimals (BE-13); they are only formatted
// for display, never recomputed on the client.
export function SettlementBreakdown({ settlement }: SettlementBreakdownProps) {
  const hasDiscounts = Number(settlement.discountsTotal) > 0;
  const hasParts = settlement.parts.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <ReceiptText className="h-5 w-5 text-lime-700" aria-hidden="true" />
        <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-900">
          Desglose de liquidación
        </h2>
      </div>

      {/* Labor */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Wrench className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Mano de obra
        </div>
        <span className="font-mono text-sm font-bold text-slate-900">
          {formatBoB(settlement.laborSubtotal)}
        </span>
      </div>

      {/* Installed parts */}
      {hasParts && (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Repuestos instalados
          </h3>
          <table className="mt-2 w-full border-collapse">
            <caption className="sr-only">Repuestos instalados y consumidos en la liquidación</caption>
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th scope="col" className="py-2 pr-3">Repuesto</th>
                <th scope="col" className="py-2 px-3 text-right">Cant.</th>
                <th scope="col" className="py-2 px-3 text-right">P. unitario</th>
                <th scope="col" className="py-2 pl-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlement.parts.map((part) => (
                <tr key={part.id}>
                  <td className="py-2 pr-3">
                    <span className="font-mono text-xs font-bold text-slate-700">{part.code}</span>
                    <span className="ml-2 text-sm text-slate-800">{part.name}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-sm text-slate-600">x{part.quantity}</td>
                  <td className="py-2 px-3 text-right font-mono text-sm text-slate-600">{formatBoB(part.unitPrice)}</td>
                  <td className="py-2 pl-3 text-right font-mono text-sm font-bold text-slate-900">{formatBoB(part.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-100 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Subtotal repuestos
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">
              {formatBoB(settlement.partsSubtotal)}
            </span>
          </div>
        </div>
      )}

      {/* Subtotal */}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
        <span className="text-sm font-bold text-slate-800">Subtotal</span>
        <span className="font-mono text-sm font-bold text-slate-900">{formatBoB(settlement.total)}</span>
      </div>

      {/* Discounts */}
      {hasDiscounts && (
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-red-600">Descuentos aplicados</span>
          <span className="font-mono text-sm font-bold text-red-600">
            − {formatBoB(settlement.discountsTotal)}
          </span>
        </div>
      )}

      {/* Final total */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
        <span className="text-base font-extrabold text-lime-900">Total a pagar</span>
        <span className="font-mono text-xl font-extrabold text-lime-800">
          {formatBoB(settlement.totalAfterDiscounts)}
        </span>
      </div>
    </section>
  );
}