import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react';

import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import type { BudgetApprovalChannel, BudgetDecision, BudgetItem } from '../api/useBudgetApproval';

interface ApprovalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (values: DecisionFormValues) => void;
  decision: BudgetDecision;
  items: BudgetItem[];
  approvedItemIds: string[];
  subtotalBOB: number;
  taxBOB: number;
  discountBOB: number;
  totalBOB: number;
  isSubmitting: boolean;
}

const decisionSchema = z.object({
  decision: z.enum(['APROBADO', 'RECHAZADO']),
  channel: z.enum(['CALL', 'WHATSAPP', 'IN_PERSON'], {
    message: 'Selecciona el canal de comunicación.',
  }),
  notes: z.string().trim(),
  rejectionReason: z.string().optional(),
}).superRefine((values, context) => {
  if (values.decision === 'APROBADO' && values.notes.trim().length < 3) {
    context.addIssue({
      code: 'custom',
      path: ['notes'],
      message: 'Registra las notas de respaldo.',
    });
  }
  if (values.decision === 'RECHAZADO' && (values.rejectionReason?.trim().length ?? 0) < 3) {
    context.addIssue({
      code: 'custom',
      path: ['rejectionReason'],
      message: 'El motivo del rechazo es obligatorio.',
    });
  }
});

export type DecisionFormValues = z.infer<typeof decisionSchema> & { channel: BudgetApprovalChannel };

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
  decision,
}: ApprovalSummaryModalProps) {
  const approvedItems = items.filter((item) => approvedItemIds.includes(item.id));
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      decision,
      channel: 'CALL',
      notes: '',
      rejectionReason: '',
    },
    mode: 'onBlur',
  });

  const selectedDecision = watch('decision');

  useEffect(() => {
    if (isOpen) {
      reset({ decision, channel: 'CALL', notes: '', rejectionReason: '' });
    }
  }, [decision, isOpen, reset]);

  return (
    <Modal variant="light" isOpen={isOpen} onClose={onClose} title="Registrar decisión del cliente" subtitle="La decisión quedará asociada a la OT y a su medio de comunicación.">
      <form className="space-y-4" onSubmit={handleSubmit((values) => onConfirm(values))}>
        <div className="grid grid-cols-2 gap-2">
          <label className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-bold transition-colors ${selectedDecision === 'APROBADO' ? 'border-lime-300 bg-lime-50 text-lime-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <input type="radio" value="APROBADO" {...register('decision')} className="sr-only" />
            <CheckCircle2 className="h-5 w-5" />
            Aprobar presupuesto
          </label>
          <label className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-bold transition-colors ${selectedDecision === 'RECHAZADO' ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <input type="radio" value="RECHAZADO" {...register('decision')} className="sr-only" />
            <XCircle className="h-5 w-5" />
            Rechazar presupuesto
          </label>
        </div>

        {selectedDecision === 'APROBADO' ? (
          <div className="flex items-start gap-3 rounded-xl border border-lime-200 bg-lime-50 p-3.5 text-sm text-lime-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" />
            <p><strong>{approvedItems.length} ítems</strong> quedarán autorizados para la orden de trabajo.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>El rechazo libera los repuestos reservados y mantiene la OT visible hasta el retiro del vehículo.</p>
          </div>
        )}

        {selectedDecision === 'APROBADO' && (
          <>
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
          </>
        )}

        <div>
          <label htmlFor="approval-channel" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Canal de comunicación</label>
          <select id="approval-channel" {...register('channel')} className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-lime-500 focus:outline-none">
            <option value="CALL">Llamada</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="IN_PERSON">Presencial</option>
          </select>
          {errors.channel && <p className="mt-1 text-xs font-semibold text-red-700">{errors.channel.message}</p>}
        </div>

        <div>
          <label htmlFor="approval-notes" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Notas de respaldo</label>
          <textarea id="approval-notes" {...register('notes')} rows={3} placeholder="Ej.: Cliente confirmó el alcance y las condiciones del presupuesto." className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none" />
          {errors.notes && <p className="mt-1 text-xs font-semibold text-red-700">{errors.notes.message}</p>}
        </div>

        {selectedDecision === 'RECHAZADO' && (
          <div>
            <label htmlFor="rejection-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">Motivo obligatorio del rechazo</label>
            <textarea id="rejection-reason" {...register('rejectionReason')} rows={3} placeholder="Indica por qué el cliente rechazó el presupuesto." className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none" />
            {errors.rejectionReason && <p className="mt-1 text-xs font-semibold text-red-700">{errors.rejectionReason.message}</p>}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant={selectedDecision === 'APROBADO' ? 'primary' : 'danger'} isLoading={isSubmitting} leftIcon={selectedDecision === 'APROBADO' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}>
            {selectedDecision === 'APROBADO' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
