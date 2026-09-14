import { z } from 'zod';

// US-21 (FE-T21.2, RN-19): rejection requires the customer's reason, archived
// permanently. Mirror of RejectAdditionalFindingDto (reason 3-1000,
// non-whitespace).
export const rejectAdditionalFindingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'El motivo del rechazo es obligatorio (mínimo 3 caracteres).')
    .max(1000, 'El motivo no puede superar los 1000 caracteres.')
    .refine((value) => value.trim().length > 0, {
      message: 'El motivo no puede ser solo espacios.',
    }),
});

export type RejectAdditionalFindingFormValues = z.infer<
  typeof rejectAdditionalFindingSchema
>;