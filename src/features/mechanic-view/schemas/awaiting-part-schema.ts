import { z } from 'zod';

export const awaitingPartSchema = z.object({
  missingPartId: z.string().min(1, 'Selecciona el repuesto faltante'),
  quantity: z
    .number()
    .positive('La cantidad faltante debe ser mayor a 0'),
  reason: z
    .string()
    .trim()
    .min(1, 'Ingresa el motivo de la espera'),
});

export type AwaitingPartFormValues = z.infer<typeof awaitingPartSchema>;