import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import type { ApprovalChannel } from '../api/types';
import {
  approveAdditionalFindingSchema,
} from '../schemas/approve-additional-finding-schema';
import {
  rejectAdditionalFindingSchema,
} from '../schemas/reject-additional-finding-schema';

export type ResolveDecision = 'APPROVE' | 'REJECT';

export interface ResolveAdditionalFindingFormValues {
  decision: ResolveDecision;
  channel: ApprovalChannel;
  customerName: string;
  notes: string;
  reason: string;
}

const resolveAdditionalFindingSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REJECT']),
    channel: z.enum(['CALL', 'WHATSAPP', 'IN_PERSON']),
    customerName: z.string(),
    notes: z.string(),
    reason: z.string(),
  })
  .superRefine((values, context) => {
    if (values.decision === 'APPROVE') {
      const approveResult = approveAdditionalFindingSchema.safeParse({
        channel: values.channel,
        customerName: values.customerName,
        notes: values.notes,
      });
      if (!approveResult.success) {
        for (const issue of approveResult.error.issues) {
          context.addIssue({
            code: 'custom',
            path: [...issue.path],
            message: issue.message,
          });
        }
      }
    } else {
      const rejectResult = rejectAdditionalFindingSchema.safeParse({
        reason: values.reason,
      });
      if (!rejectResult.success) {
        for (const issue of rejectResult.error.issues) {
          context.addIssue({
            code: 'custom',
            path: [...issue.path],
            message: issue.message,
          });
        }
      }
    }
  });

interface ResolveAdditionalFindingModalProps {
  isOpen: boolean;
  order: {
    plate: string;
    findingDescription: string | null;
  };
  onClose: () => void;
  onConfirm: (values: ResolveAdditionalFindingFormValues) => void;
  isPending: boolean;
}

// US-21 (FE-T21.2): the reception or the workshop lead records the customer
// decision about the unforeseen finding. Approving registers the channel and
// the authorizing customer (HU-09 / RN-07); rejecting archives the reason
// permanently (RN-19). No monetary value is shown (RN-16).
export function ResolveAdditionalFindingModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  isPending,
}: ResolveAdditionalFindingModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResolveAdditionalFindingFormValues>({
    resolver: zodResolver(resolveAdditionalFindingSchema),
    defaultValues: {
      decision: 'APPROVE',
      channel: 'CALL',
      customerName: '',
      notes: '',
      reason: '',
    },
    mode: 'onBlur',
  });

  const selectedDecision = watch('decision');

  useEffect(() => {
    if (isOpen) {
      reset({
        decision: 'APPROVE',
        channel: 'CALL',
        customerName: '',
        notes: '',
        reason: '',
      });
    }
  }, [isOpen, reset]);

  return (
    <Modal
      variant="light"
      isOpen={isOpen}
      onClose={onClose}
      title="Resolver ampliación de presupuesto"
      subtitle={`${order.plate} · Decisión del cliente sobre la falla imprevista`}
      maxWidth="lg"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => onConfirm(values))}
        noValidate
      >
        {order.findingDescription && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Hallazgo reportado por el mecánico
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-950">
                {order.findingDescription}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label
            className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-bold transition-colors ${
              selectedDecision === 'APPROVE'
                ? 'border-lime-300 bg-lime-50 text-lime-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              value="APPROVE"
              {...register('decision')}
              className="sr-only"
            />
            <CheckCircle2 className="h-5 w-5" />
            Aprobar ampliación
          </label>
          <label
            className={`flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center text-xs font-bold transition-colors ${
              selectedDecision === 'REJECT'
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              value="REJECT"
              {...register('decision')}
              className="sr-only"
            />
            <XCircle className="h-5 w-5" />
            Rechazar y continuar reparación base
          </label>
        </div>

        {selectedDecision === 'APPROVE' ? (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-lime-200 bg-lime-50 p-3.5 text-sm text-lime-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" aria-hidden="true" />
              <p>
                Al aprobar, los repuestos sugeridos quedan{' '}
                <strong>reservados</strong> y la OT retoma{' '}
                <strong>EN_REPARACION</strong> para que el mecánico intervenga
                la falla.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="resolve-channel"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Canal de comunicación
                </label>
                <select
                  id="resolve-channel"
                  {...register('channel')}
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-lime-500 focus:outline-none"
                >
                  <option value="CALL">Llamada</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_PERSON">Presencial</option>
                </select>
                {errors.channel && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                    {errors.channel.message}
                  </p>
                )}
              </div>

              <Input
                id="resolve-customer-name"
                tone="light"
                label="Cliente que autoriza"
                required
                placeholder="Nombre del cliente"
                error={errors.customerName?.message}
                {...register('customerName')}
              />
            </div>

            <div>
              <label
                htmlFor="resolve-notes"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Notas de respaldo
              </label>
              <textarea
                id="resolve-notes"
                rows={3}
                placeholder="Ej.: Cliente confirmó el alcance de la ampliación por WhatsApp."
                className={`w-full rounded-xl border bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-lime-500 focus:outline-none ${
                  errors.notes ? 'border-red-400' : 'border-slate-300'
                }`}
                {...register('notes')}
              />
              {errors.notes && (
                <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <p>
                El hallazgo quedará archivado permanentemente como{' '}
                <strong>"Daño no reparado por decisión del cliente"</strong>{' '}
                y la OT retomará <strong>EN_REPARACION</strong> solo con
                las tareas base aprobadas.
              </p>
            </div>

            <div>
              <label
                htmlFor="resolve-reason"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                Motivo del rechazo
              </label>
              <textarea
                id="resolve-reason"
                rows={3}
                placeholder="Indica por qué el cliente rechazó la reparación (mínimo 3 caracteres)."
                className={`w-full rounded-xl border bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none ${
                  errors.reason ? 'border-red-400' : 'border-slate-300'
                }`}
                {...register('reason')}
              />
              {errors.reason && (
                <p role="alert" className="mt-1 text-xs font-semibold text-red-600">
                  {errors.reason.message}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline-light"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={selectedDecision === 'APPROVE' ? 'primary' : 'danger'}
            isLoading={isPending}
            disabled={isPending}
            leftIcon={
              selectedDecision === 'APPROVE' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )
            }
          >
            {selectedDecision === 'APPROVE'
              ? 'Confirmar aprobación'
              : 'Confirmar rechazo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}