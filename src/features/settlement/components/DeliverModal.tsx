import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Check, CreditCard, QrCode, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import {
  deliverSchema,
  type DeliverFormValues,
} from '../schemas/deliver-schema';
import type { PaymentMethod } from '../api/settlement.types';
import { formatBoB } from '../lib/money';

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'CASH', label: 'Efectivo', icon: Banknote },
  { value: 'QR_TRANSFER', label: 'QR / Transferencia', icon: QrCode },
  { value: 'CARD', label: 'Tarjeta', icon: CreditCard },
];

interface DeliverModalProps {
  isOpen: boolean;
  plate: string;
  totalToCharge: string;
  onClose: () => void;
  onSubmit: (
    payload: { paymentMethod: PaymentMethod; receiptNumber: string; deliveryNotes?: string },
  ) => Promise<void>;
  isPending: boolean;
}

// US-20 / RN-21: registers payment and the vehicle handover. The backend
// computes the charged total; the form only collects payment data (BE-13).
export function DeliverModal({
  isOpen,
  plate,
  totalToCharge,
  onClose,
  onSubmit,
  isPending,
}: DeliverModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DeliverFormValues>({
    resolver: zodResolver(deliverSchema),
    defaultValues: { paymentMethod: 'CASH', receiptNumber: '', deliveryNotes: '' },
  });

  const [selected, setSelected] = useState<PaymentMethod>('CASH');
  const paymentMethod = watch('paymentMethod');

  const selectMethod = (method: PaymentMethod) => {
    setSelected(method);
    setValue('paymentMethod', method, { shouldValidate: true, shouldDirty: true });
  };

  const submitForm = handleSubmit(async (values) => {
    try {
      await onSubmit({
        paymentMethod: values.paymentMethod,
        receiptNumber: values.receiptNumber.trim(),
        deliveryNotes: values.deliveryNotes?.trim() || undefined,
      });
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
      title="Entregar vehículo y cobrar"
      subtitle={`${plate} · Total a cobrar: ${formatBoB(totalToCharge)}`}
      variant="light"
      maxWidth="md"
    >
      <form onSubmit={submitForm} className="space-y-5" noValidate>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Método de pago
          </span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Método de pago">
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
              const isActive = paymentMethod === value || selected === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectMethod(value)}
                  aria-pressed={isActive}
                  className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-xs font-bold transition ${
                    isActive
                      ? 'border-lime-500 bg-lime-50 text-lime-900'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                  {isActive && (
                    <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-lime-700" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="sr-only">
            <input type="radio" value="CASH" {...register('paymentMethod')} />
            <input type="radio" value="QR_TRANSFER" {...register('paymentMethod')} />
            <input type="radio" value="CARD" {...register('paymentMethod')} />
          </div>
          {errors.paymentMethod && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>

        <Input
          id="receipt-number"
          tone="light"
          type="text"
          label="Número de comprobante"
          required
          placeholder="REC-001"
          maxLength={50}
          error={errors.receiptNumber?.message}
          {...register('receiptNumber')}
        />

        <div>
          <label
            htmlFor="delivery-notes"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Notas de entrega (opcional)
          </label>
          <textarea
            id="delivery-notes"
            rows={3}
            placeholder="Ej. Cliente satisfecho, llaves entregadas."
            maxLength={500}
            className={`min-h-[90px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.deliveryNotes
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
            }`}
            {...register('deliveryNotes')}
          />
          {errors.deliveryNotes && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {errors.deliveryNotes.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
          <span className="text-sm font-extrabold text-lime-900">Total a cobrar</span>
          <span className="font-mono text-lg font-extrabold text-lime-800">
            {formatBoB(totalToCharge)}
          </span>
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
            Confirmar Entrega
          </Button>
        </div>
      </form>
    </Modal>
  );
}