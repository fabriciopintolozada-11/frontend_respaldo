import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import {
  awaitingPartSchema,
  type AwaitingPartFormValues,
} from '../schemas/awaiting-part-schema';

import type { AssignedWorkOrderDetail } from '../api/types';
import type { SetAwaitingPartPayload } from '../api/awaiting-part-api';

interface AwaitingPartModalProps {
  isOpen: boolean;
  order: AssignedWorkOrderDetail | null;
  onClose: () => void;
  onSubmit: (
    orderId: string,
    payload: SetAwaitingPartPayload,
  ) => Promise<void>;
  isPending: boolean;
}

export function AwaitingPartModal({
  isOpen,
  order,
  onClose,
  onSubmit,
  isPending,
}: AwaitingPartModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AwaitingPartFormValues>({
    resolver: zodResolver(awaitingPartSchema),
    defaultValues: {
      missingPartId: '',
      quantity: 1,
      reason: '',
    },
  });

  const submitForm = handleSubmit(async (values) => {
    if (!order) {
      return;
    }

    await onSubmit(order.id, {
      missingPartId: values.missingPartId,
      quantity: values.quantity,
      reason: values.reason.trim(),
    });

    reset();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="En espera de repuesto"
      subtitle={
        order
          ? `OT ${order.id.slice(0, 8).toUpperCase()} · ${order.plate}`
          : undefined
      }
      variant="light"
      maxWidth="md"
    >
      <form
        onSubmit={submitForm}
        className="space-y-5"
        noValidate
      >
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <p className="text-sm font-bold text-amber-900">
              Registrar falta física de repuesto
            </p>

            <p className="mt-1 text-xs text-amber-800">
              La Orden de Trabajo quedará en estado En Espera de Repuesto.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="missing-part"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Repuesto faltante
            <span className="ml-1 text-red-600">*</span>
          </label>

          <div className="relative">
            <Package className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />

            <select
              id="missing-part"
              className={`min-h-[44px] w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                errors.missingPartId
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
              }`}
              {...register('missingPartId')}
            >
              <option value="">
                Selecciona un repuesto asociado a la OT
              </option>

              {(order?.quote?.parts ?? []).map((part) => (
                <option
                  key={part.id}
                  value={part.sparePartId}
                >
                  {part.sparePart.code} - {part.sparePart.name}
                </option>
              ))}
            </select>
          </div>

          {errors.missingPartId && (
            <p
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.missingPartId.message}
            </p>
          )}

          {(order?.quote?.parts.length ?? 0) === 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Esta OT no tiene repuestos asociados.
            </p>
          )}
        </div>

        <Input
          id="missing-part-quantity"
          tone="light"
          type="number"
          min="1"
          step="1"
          label="Cantidad faltante"
          required
          error={errors.quantity?.message}
          {...register('quantity', {
            valueAsNumber: true,
          })}
        />

        <div>
          <label
            htmlFor="awaiting-part-reason"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Motivo
            <span className="ml-1 text-red-600">*</span>
          </label>

          <textarea
            id="awaiting-part-reason"
            rows={4}
            placeholder="Ej. La pieza reservada no se encuentra físicamente en el estante."
            className={`min-h-[110px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.reason
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
            }`}
            {...register('reason')}
          />

          {errors.reason && (
            <p
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="warning"
            isLoading={isPending}
            disabled={isPending || !order || (order.quote?.parts.length ?? 0) === 0}
          >
            Confirmar espera
          </Button>
        </div>
      </form>
    </Modal>
  );
}