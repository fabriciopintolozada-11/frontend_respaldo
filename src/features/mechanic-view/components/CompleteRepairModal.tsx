import { zodResolver } from '@hookform/resolvers/zod';
import { Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import {
  completeRepairSchema,
  type CompleteRepairFormValues,
} from '../schemas/complete-repair-schema';
import type { CompleteWorkOrderPayload } from '../api/complete-work-order.types';

export interface CompleteRepairOrderContext {
  id: string;
  plate: string;
}

interface CompleteRepairModalProps {
  isOpen: boolean;
  order: CompleteRepairOrderContext | null;
  onClose: () => void;
  onSubmit: (
    orderId: string,
    payload: CompleteWorkOrderPayload,
  ) => Promise<void>;
  isPending: boolean;
}

export function CompleteRepairModal({
  isOpen,
  order,
  onClose,
  onSubmit,
  isPending,
}: CompleteRepairModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteRepairFormValues>({
    resolver: zodResolver(completeRepairSchema),
    defaultValues: {
      finalMileage: undefined,
      closingNotes: '',
    },
  });

  const submitForm = handleSubmit(async (values) => {
    if (!order) {
      return;
    }

    const payload: CompleteWorkOrderPayload = {
      finalMileage: values.finalMileage,
      closingNotes: values.closingNotes?.trim() || undefined,
    };

    try {
      await onSubmit(order.id, payload);
      reset();
    } catch {
      // The parent (MechanicConsoleView / WorkOrderTrackingPage) reports the
      // failure via toast; keep the typed values so the user can retry.
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
      title="Concluir reparación"
      subtitle={
        order
          ? `OT-${order.id.slice(0, 8).toUpperCase()} · ${order.plate}`
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
        <div className="flex items-start gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4">
          <Flag className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" />

          <div>
            <p className="text-sm font-bold text-lime-900">
              Confirmar finalización de los trabajos mecánicos
            </p>

            <p className="mt-1 text-xs text-lime-800">
              La Orden de Trabajo pasará a &quot;Listo para Entrega&quot; y la
              bahía ocupada quedará disponible automáticamente.
            </p>
          </div>
        </div>

        <Input
          id="final-mileage"
          tone="light"
          type="number"
          min="0"
          max="1000000"
          step="1"
          label="Kilometraje final (km)"
          required
          inputMode="numeric"
          error={errors.finalMileage?.message}
          {...register('finalMileage', {
            valueAsNumber: true,
          })}
        />

        <div>
          <label
            htmlFor="closing-notes"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            Notas de control de calidad (opcional)
          </label>

          <textarea
            id="closing-notes"
            rows={4}
            placeholder="Ej. Radiador reemplazado y probado en ruta."
            maxLength={1000}
            className={`min-h-[110px] w-full rounded-xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
              errors.closingNotes
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-lime-500 focus:ring-lime-200'
            }`}
            {...register('closingNotes')}
          />

          {errors.closingNotes && (
            <p
              role="alert"
              className="mt-1 text-xs font-medium text-red-600"
            >
              {errors.closingNotes.message}
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
            variant="primary"
            isLoading={isPending}
            disabled={isPending || !order}
          >
            Concluir Reparación
          </Button>
        </div>
      </form>
    </Modal>
  );
}