import { z } from 'zod';

// US-20 / RN-15: a settlement discount can only be applied by WORKSHOP_LEAD.
// Mirrors the backend ApplyDiscountDto bounds (0.01 - 999999.99, 2 decimals,
// reason 10-500 non-whitespace-only).
export const applyDiscountSchema = z.object({
  amount: z
    .number({ error: 'Ingresa el monto del descuento.' })
    .refine(Number.isFinite, { message: 'Monto inválido.' })
    .min(0.01, 'El descuento debe ser mayor a 0.01')
    .max(999999.99, 'El descuento no puede exceder 999,999.99')
    .refine((value) => (value.toString().split('.')[1]?.length ?? 0) <= 2, {
      message: 'Máximo 2 decimales',
    }),
  reason: z
    .string({ error: 'El motivo es obligatorio.' })
    .trim()
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres')
    .refine((value) => value.length > 0, {
      message: 'El motivo no puede ser solo espacios',
    }),
});

export type ApplyDiscountFormValues = z.infer<typeof applyDiscountSchema>;