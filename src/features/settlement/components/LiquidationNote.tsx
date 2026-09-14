import { Banknote, Building2, Car, Clock, FileSignature, Gavel, ReceiptText, Wrench } from 'lucide-react';

import type { DeliverResponse, PaymentMethod, SettlementResponse } from '../api/settlement.types';
import { formatBoB } from '../lib/money';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  QR_TRANSFER: 'QR / Transferencia',
  CARD: 'Tarjeta',
};

function formatDeliveryDate(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

interface LiquidationNoteProps {
  settlement: SettlementResponse;
  delivery?: DeliverResponse | null;
}

// US-20 / FE-T20.2: printable "Nota de Liquidación y Entrega". Internal
// proof-of-charge document without fiscal value, built from the settlement
// breakdown (RN-21) plus the delivery record when it already happened. The
// print stylesheet only exposes this node when the parent enables
// body.settlement-printing before calling window.print().
export function LiquidationNote({ settlement, delivery }: LiquidationNoteProps) {
  const hasDiscounts = Number(settlement.discountsTotal) > 0;
  const hasParts = settlement.parts.length > 0;

  return (
    <div className="liquidation-note">
      <style>{`
        @media print {
          @page { size: auto; margin: 12mm; }
          body.settlement-printing * { visibility: hidden; }
          body.settlement-printing .liquidation-note,
          body.settlement-printing .liquidation-note * { visibility: visible; }
          body.settlement-printing .liquidation-note { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 sm:p-8 print:shadow-none print:border-0">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-9 w-9 text-lime-700" aria-hidden="true" />
            <div>
              <p className="text-base font-black tracking-tight text-slate-950">
                Taller Automotriz La Fratelli
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-lime-700">
                Liquidación y entrega de vehículo
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Documento sin valor fiscal
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Comprobante interno · BOB
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Car className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Placa</dt>
              <dd className="font-mono text-lg font-extrabold tracking-wide">{settlement.plate}</dd>
            </div>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Vehículo</dt>
            <dd className="font-semibold">
              {settlement.brand} {settlement.model} ({settlement.year})
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cliente</dt>
            <dd className="font-semibold">{settlement.customerName}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Orden de trabajo
            </dt>
            <dd className="font-mono text-xs font-semibold text-slate-600">
              {settlement.workOrderId.toUpperCase()}
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <ReceiptText className="h-4 w-4 text-lime-700" aria-hidden="true" />
              Desglose de cuenta
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {settlement.currency}
            </span>
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Wrench className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Mano de obra
              </span>
              <span className="font-mono text-sm font-bold">{formatBoB(settlement.laborSubtotal)}</span>
            </div>

            {hasParts && (
              <table className="mt-3 w-full border-collapse">
                <caption className="sr-only">Repuestos instalados en la liquidación</caption>
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th scope="col" className="py-1.5 pr-3">Repuesto</th>
                    <th scope="col" className="py-1.5 px-3 text-right">Cant.</th>
                    <th scope="col" className="py-1.5 px-3 text-right">P. unitario</th>
                    <th scope="col" className="py-1.5 pl-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlement.parts.map((part) => (
                    <tr key={part.id}>
                      <td className="py-1.5 pr-3">
                        <span className="font-mono text-xs font-bold text-slate-600">{part.code}</span>
                        <span className="ml-2 text-sm text-slate-800">{part.name}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-sm text-slate-600">x{part.quantity}</td>
                      <td className="py-1.5 px-3 text-right font-mono text-sm text-slate-600">
                        {formatBoB(part.unitPrice)}
                      </td>
                      <td className="py-1.5 pl-3 text-right font-mono text-sm font-bold">
                        {formatBoB(part.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Subtotal repuestos
              </span>
              <span className="font-mono text-sm font-bold">{formatBoB(settlement.partsSubtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-slate-800">Subtotal</span>
              <span className="font-mono text-sm font-bold">{formatBoB(settlement.total)}</span>
            </div>

            {hasDiscounts && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  <Gavel className="h-4 w-4" aria-hidden="true" />
                  Descuentos aplicados
                </span>
                <span className="font-mono text-sm font-bold text-red-600">
                  − {formatBoB(settlement.discountsTotal)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
              <span className="text-base font-extrabold text-lime-900">Total a pagar</span>
              <span className="font-mono text-xl font-extrabold text-lime-800">
                {formatBoB(settlement.totalAfterDiscounts)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileSignature className="h-4 w-4 text-lime-700" aria-hidden="true" />
            {delivery ? 'Datos de la entrega' : 'Entrega pendiente de cobro'}
          </p>
          {delivery ? (
            <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fecha y hora de retiro
                </dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                  <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {formatDeliveryDate(delivery.deliveredAt)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Método de pago
                </dt>
                <dd className="flex items-center gap-1.5 font-semibold">
                  <Banknote className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {PAYMENT_METHOD_LABELS[delivery.paymentMethod]}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Número de comprobante
                </dt>
                <dd className="font-mono text-sm font-bold">{delivery.receiptNumber}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total cobrado
                </dt>
                <dd className="font-mono text-sm font-extrabold text-lime-800">
                  {formatBoB(delivery.totalCharged)}
                </dd>
              </div>
              {delivery.deliveryNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Notas de entrega
                  </dt>
                  <dd className="text-sm text-slate-700">{delivery.deliveryNotes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              La cuenta debe ser cobrada y la entrega registrada para archivar la orden.
            </p>
          )}
        </div>

        <p className="mt-6 border-t border-dashed border-slate-200 pt-3 text-center text-xs text-slate-400">
          Gracias por confiar en La Fratelli. Conserva este comprobante interno como constancia de pago.
        </p>
      </div>
    </div>
  );
}