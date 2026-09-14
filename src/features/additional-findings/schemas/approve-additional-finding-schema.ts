import { z } from 'zod';

// US-21 (FE-T21.2, HU-09): approval registers the communication channel and
// the customer who authorized the supplementary budget. Mirror of
// ApproveAdditionalFindingDto (channel enum, customerName 3-150, notes 3-2000).
export const approveAdditionalFindingSchema = z.object({
  channel: z.enum(['CALL', 'WHATSAPP', 'IN_PERSON'], {
    required_error: 'Selecciona el canal de comunicación.',
  }),
  customerName: z
    .string()
    .trim()
    .min(3, 'Registra el nombre del cliente que autoriza (mínimo 3 caracteres).')
    .max(150, 'El nombre no puede superar los 150 caracteres.'),
  notes: z
    .string()
    .trim()
    .min(3, 'Registra las notas de respaldo (mínimo 3 caracteres).')
    .max(2000, 'Las notas no pueden superar los 2000 caracteres.'),
});

export type ApproveAdditionalFindingFormValues = z.infer<
  typeof approveAdditionalFindingSchema
>;