import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El nombre de usuario es obligatorio')
    .max(80, 'Máximo 80 caracteres'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
