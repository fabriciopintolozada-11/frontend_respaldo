import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';

import type { SettlementAdjustmentSummary } from '../api/settlement.types';
import { formatBoB } from '../lib/money';

interface VoidAdjustmentModalProps {
  isOpen: boolean;
  adjustment: SettlementAdjustmentSummary | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isPending: boolean;
}

interface VoidFormValues {
  reason: string;
}

// US-20 / RN-15: confirms the reversal of a previously applied discount. The
// backend creates a VOID record (audit trail, RN-19) instead of deleting the
// original DISCOUNT.
export function VoidAdjustmentModal({
  isOpen,
  adjustment,
  onClose,
  onSubmit,
  isPending,
}: VoidAdjustmentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoidFormValues>({
    defaultValues: { reason: '' },
  });

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit(values.reason.trim());
      reset();
    } catch {
      // The page reports the failure via toast; keep the values for retry.
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!adjustment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Anular descuento"
      subtitle="La anulación queda registrada en el historial inmutable (RN-19)"
      variant="light"
      maxWidth="md"
    >
      <form onSubmit={submitForm} className="space-y-5" noValidate>
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-900">
              Revertir descuento de {formatBoB(adjustment.amount)}
            </p>
            <p className="mt-1 text-xs text-red-800">
              Motivo original: «{adjustment.reason}»
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="void-reason"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Motivo de la anulación
          </label>
          <textarea
            id="void-reason"
            rows={4}
            placeholder="Ej. Descuento aplicado por error, se revierte."
            minLength={10}
            maxLength={500}
            className={`min-h-[110px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.reason
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
            }`}
            {...register('reason', {
              required: 'El motivo de anulación es obligatorio.',
              minLength: {
                value: 10,
                message: 'Mínimo 10 caracteres',
              },
              maxLength: {
                value: 500,
                message: 'Máximo 500 caracteres',
              },
              validate: (value) =>
                value.trim().length > 0 || 'El motivo no puede ser solo espacios',
            })}
          />
          {errors.reason && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline-light"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={isPending}
            disabled={isPending}
          >
            Confirmar Anulación
          </Button>
        </div>
      </form>
    </Modal>
  );
}