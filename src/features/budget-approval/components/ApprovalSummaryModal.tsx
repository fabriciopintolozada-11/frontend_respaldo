import { CheckCircle2, CircleAlert } from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import type { BudgetItem } from '../api/useBudgetApproval';

interface ApprovalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: BudgetItem[];
  approvedItemIds: string[];
  subtotalBOB: number;
  taxBOB: number;
  discountBOB: number;
  totalBOB: number;
  isSubmitting: boolean;
}

const moneyFormatter = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} BOB`;
}

export function ApprovalSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  approvedItemIds,
  subtotalBOB,
  taxBOB,
  discountBOB,
  totalBOB,
  isSubmitting,
}: ApprovalSummaryModalProps) {
  const approvedItems = items.filter((item) => approvedItemIds.includes(item.id));

  return (
    <Modal variant="light" isOpen={isOpen} onClose={onClose} title="Confirmar aprobación" subtitle="Revisa el alcance antes de registrar la autorización del cliente.">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-lime-200 bg-lime-50 p-3.5 text-sm text-lime-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" />
          <p><strong>{approvedItems.length} ítems</strong> quedarán autorizados para la orden de trabajo.</p>
        </div>

        <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          {approvedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-slate-700">
              <span className="truncate">{item.description}</span>
              <strong className="shrink-0 font-mono text-slate-900">{formatMoney(item.totalBOB)}</strong>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal seleccionado</span><strong className="font-mono text-slate-900">{formatMoney(subtotalBOB)}</strong></div>
          <div className="flex justify-between text-slate-600"><span>IVA estimado (13%)</span><strong className="font-mono text-slate-900">{formatMoney(taxBOB)}</strong></div>
          <div className="flex justify-between text-emerald-700"><span>Descuento aplicado</span><strong className="font-mono">-{formatMoney(discountBOB)}</strong></div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-950"><span>Total general</span><strong className="font-mono text-lime-700">{formatMoney(totalBOB)}</strong></div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Los ítems no seleccionados serán registrados como rechazados en esta revisión.</p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={onClose}>Volver a revisar</Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={onConfirm} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
            Confirmar aprobación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
