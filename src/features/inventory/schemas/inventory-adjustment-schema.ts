import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  sparePartId: z.string().min(1, 'Selecciona un repuesto'),
  quantity: z
    .number()
    .refine((value) => Number.isFinite(value), 'Ingresa una cantidad válida'),
  type: z.string().min(1, 'Selecciona el tipo de ajuste'),
  reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo del ajuste'),
});

export type InventoryAdjustmentFormValues = z.infer<
  typeof inventoryAdjustmentSchema
>;