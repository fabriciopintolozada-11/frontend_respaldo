import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Modal } from '../../../shared/components/Modal';

import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentFormValues,
} from '../schemas/inventory-adjustment-schema';

import type { CreateInventoryAdjustmentPayload } from '../api/inventory-adjustments-api';

interface AdjustmentTypeOption {
  value: string;
  label: string;
}

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  sparePartId: string | null;
  sparePartLabel: string;
  adjustmentTypes: AdjustmentTypeOption[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateInventoryAdjustmentPayload) => Promise<void>;
}

export function InventoryAdjustmentModal({
  isOpen,
  sparePartId,
  sparePartLabel,
  adjustmentTypes,
  isPending,
  onClose,
  onSubmit,
}: InventoryAdjustmentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryAdjustmentFormValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      sparePartId: '',
      quantity: 1,
      type: '',
      reason: '',
    },
  });

  useEffect(() => {
    reset({
      sparePartId: sparePartId ?? '',
      quantity: 1,
      type: '',
      reason: '',
    });
  }, [sparePartId, reset]);

  const submitForm = handleSubmit(async (values) => {
    await onSubmit({
      sparePartId: values.sparePartId,
      quantity: values.quantity,
      type: values.type,
      reason: values.reason.trim(),
    });
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar ajuste físico"
      subtitle={sparePartLabel || undefined}
      maxWidth="md"
    >
      <form onSubmit={submitForm} className="space-y-5" noValidate>
        <input type="hidden" {...register('sparePartId')} />

        <Input
          label="Cantidad"
          type="number"
          min="1"
          step="1"
          required
          error={errors.quantity?.message}
          {...register('quantity', { valueAsNumber: true })}
        />

        <div>
          <label
            htmlFor="inventory-adjustment-type"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8E949F]"
          >
            Tipo de ajuste
            <span className="ml-1 text-red-500">*</span>
          </label>

          <select
            id="inventory-adjustment-type"
            className={`min-h-[44px] w-full rounded-xl border bg-[#0F1115] px-3.5 py-2.5 text-sm text-[#E0E2E6] outline-none ${
              errors.type
                ? 'border-red-500'
                : 'border-[#2D3139] focus:border-[#F97316]'
            }`}
            {...register('type')}
          >
            <option value="">Selecciona el tipo de ajuste</option>

            {adjustmentTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {errors.type && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-500">
              {errors.type.message}
            </p>
          )}

          {adjustmentTypes.length === 0 && (
            <p className="mt-2 text-xs text-amber-500">
              Los tipos de ajuste estarán disponibles cuando el backend publique
              el contrato correspondiente.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="inventory-adjustment-reason"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8E949F]"
          >
            Motivo
            <span className="ml-1 text-red-500">*</span>
          </label>

          <textarea
            id="inventory-adjustment-reason"
            rows={4}
            placeholder="Describe la diferencia encontrada durante el conteo físico."
            className={`min-h-[110px] w-full rounded-xl border bg-[#0F1115] p-3 text-sm text-[#E0E2E6] outline-none ${
              errors.reason
                ? 'border-red-500'
                : 'border-[#2D3139] focus:border-[#F97316]'
            }`}
            {...register('reason')}
          />

          {errors.reason && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-500">
              {errors.reason.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#2D3139] pt-5 sm:flex-row sm:justify-end">
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
            disabled={
              isPending ||
              !sparePartId ||
              adjustmentTypes.length === 0
            }
          >
            Guardar ajuste
          </Button>
        </div>
      </form>
    </Modal>
  );
}