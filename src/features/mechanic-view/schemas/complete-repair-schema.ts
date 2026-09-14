import { z } from 'zod';

// US-19 / FE-11: closing data of a repair. finalMileage is required in the UI
// because the Gherkin scenario has the mechanic entering it; the backend DTO
// accepts it as optional anyway (and enforces int 0-1,000,000).
export const completeRepairSchema = z.object({
  finalMileage: z
    .number({ error: 'Ingresa el kilometraje final.' })
    .int('El kilometraje debe ser un número entero.')
    .min(0, 'El kilometraje no puede ser negativo.')
    .max(1_000_000, 'El kilometraje no puede exceder 1,000,000 km.'),
  closingNotes: z
    .string()
    .trim()
    .max(1000, 'Máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type CompleteRepairFormValues = z.infer<typeof completeRepairSchema>;