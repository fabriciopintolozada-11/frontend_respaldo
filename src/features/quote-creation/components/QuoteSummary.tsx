import { useMemo } from 'react';
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';

import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import type { QuoteResponse } from '../api/useQuoteCreation';

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatBs(amount: number | string): string {
  const value = Number(amount);
  return `Bs. ${money.format(Number.isFinite(value) ? value : 0)}`;
}

interface QuoteSummaryProps {
  quote: QuoteResponse;
  onDone?: () => void;
}

export function QuoteSummary({ quote, onDone }: QuoteSummaryProps) {
  const whatsappText = useMemo(() => {
    const lines = [
      '*LOS FRATELLI · PRESUPUESTO*',
      `Presupuesto: ${quote.id}`,
      `Orden de trabajo: ${quote.workOrderId}`,
      '',
      '*Detalle de ítems:*',
      ...quote.items.map((item, index) => `${index + 1}. ${item.description} (x${item.quantity}) — ${formatBs(item.subtotal)}`),
      '',
      `Mano de obra: ${formatBs(quote.laborSubtotal)}`,
      `Repuestos: ${formatBs(quote.partsSubtotal)}`,
      `*TOTAL: ${formatBs(quote.total)}*`,
    ];
    return lines.join('\n');
  }, [quote]);

  const handleShareWhatsApp = () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(whatsappText), '_blank');
  };

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50 p-4 sm:p-6">
      <Card variant="public" padding="lg" className="mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-lime-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Presupuesto generado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Referencia <strong className="font-mono text-slate-700">{quote.id}</strong> · OT{' '}
            <strong className="font-mono text-slate-700">{quote.workOrderId}</strong>
          </p>
        </div>

        <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {quote.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Badge variant={item.itemType === 'PART' ? 'success' : 'info'}>
                  {item.itemType === 'PART' ? 'Repuesto' : 'Mano de obra'}
                </Badge>
                <p className="mt-1 truncate text-sm font-medium text-slate-700">{item.description}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-extrabold text-slate-900">{formatBs(item.subtotal)}</p>
                <p className="text-xs text-slate-500">× {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Mano de obra</span>
            <span className="font-mono font-semibold text-slate-900">{formatBs(quote.laborSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Repuestos</span>
            <span className="font-mono font-semibold text-slate-900">{formatBs(quote.partsSubtotal)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-mono text-lg font-extrabold text-lime-700">{formatBs(quote.total)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" size="lg" className="flex-1" onClick={handleShareWhatsApp} leftIcon={<MessageCircle className="h-5 w-5" />}>
            Enviar por WhatsApp
          </Button>
          {onDone && (
            <Button variant="outline" size="lg" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900" onClick={onDone} leftIcon={<ArrowLeft className="h-5 w-5" />}>
              Volver
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}