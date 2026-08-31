import { z } from 'zod';

const requiredDescription = z.string().trim().min(1, 'Describe las fallas detectadas.');

export const diagnosticSchema = z.object({
  description: requiredDescription,
  suggestedTasks: z.array(z.string()),
  suggestedPartIds: z.array(z.string()),
  estimatedHours: z
    .number({ error: 'Ingresa un número válido de horas.' })
    .min(0, 'Las horas estimadas no pueden ser negativas.'),
});

export type DiagnosticFormValues = z.infer<typeof diagnosticSchema>;

export interface DiagnosticPayload {
  description: string;
  suggestedTasks: string[];
  suggestedPartIds: string[];
  estimatedHours: number;
}
