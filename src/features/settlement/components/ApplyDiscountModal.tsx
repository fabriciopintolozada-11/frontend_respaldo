import { zodResolver } from '@hookform/resolvers/zod';
import { BadgePercent } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import {
  applyDiscountSchema,
  type ApplyDiscountFormValues,
} from '../schemas/apply-discount-schema';
import { formatBoB } from '../lib/money';

interface ApplyDiscountModalProps {
  isOpen: boolean;
  plate: string;
  availableTotal: string;
  onClose: () => void;
  onSubmit: (payload: { amount: number; reason: string }) => Promise<void>;
  isPending: boolean;
}

// US-20 / RN-15: WORKSHOP_LEAD applies a discount to the settlement. The
// backend validates the amount against the available total (422).
export function ApplyDiscountModal({
  isOpen,
  plate,
  availableTotal,
  onClose,
  onSubmit,
  isPending,
}: ApplyDiscountModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyDiscountFormValues>({
    resolver: zodResolver(applyDiscountSchema),
    defaultValues: { amount: undefined, reason: '' },
  });

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit({ amount: values.amount, reason: values.reason.trim() });
      reset();
    } catch {
      // The page reports the failure via toast; keep the values for retry.
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Aplicar descuento"
      subtitle={`${plate} · Total disponible: ${formatBoB(availableTotal)}`}
      variant="light"
      maxWidth="md"
    >
      <form onSubmit={submitForm} className="space-y-5" noValidate>
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <BadgePercent className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Descuento sobre el total de la liquidación
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Solo el jefe de taller puede aplicar descuentos. El
              monto no puede superar el total disponible.
            </p>
          </div>
        </div>

        <Input
          id="discount-amount"
          tone="light"
          type="number"
          min="0.01"
          max="999999.99"
          step="0.01"
          inputMode="decimal"
          label="Monto del descuento (BOB)"
          required
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <div>
          <label
            htmlFor="discount-reason"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Motivo del descuento
          </label>
          <textarea
            id="discount-reason"
            rows={4}
            placeholder="Ej. Descuento por servicio incompleto en frenos."
            maxLength={500}
            className={`min-h-[110px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.reason
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
            }`}
            {...register('reason')}
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
            variant="primary"
            isLoading={isPending}
            disabled={isPending}
          >
            Aplicar Descuento
          </Button>
        </div>
      </form>
    </Modal>
  );
}