import { z } from 'zod';

import {
  SPARE_PART_CATEGORIES,
  type SparePartCategory,
} from '../spare-parts.types';

// FE-11 / FE-T23.5: client-side validation mirrors the backend DTOs
// (create-spare-part.dto.ts, create-inventory-adjustment.dto.ts) without
// replacing the backend checks (BE-10, BE-11).
export const createSparePartSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(50, 'El código debe tener máximo 50 caracteres'),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre debe tener máximo 150 caracteres'),
  category: z.enum(SPARE_PART_CATEGORIES as [SparePartCategory, ...SparePartCategory[]]),
  unitPrice: z
    .number({ invalid_type_error: 'Ingresa un precio unitario en BOB' })
    .min(0, 'El precio no puede ser negativo')
    .refine((value) => Number(value.toFixed(2)) === value, 'El precio admite máximo 2 decimales'),
  initialStock: z
    .number({ invalid_type_error: 'Ingresa el stock inicial' })
    .int('El stock inicial debe ser un número entero')
    .min(0, 'El stock inicial no puede ser negativo'),
});

export type CreateSparePartFormValues = z.infer<typeof createSparePartSchema>;

export const adjustStockSchema = z.object({
  quantity: z
    .number({ invalid_type_error: 'Ingresa la cantidad' })
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad debe ser mayor o igual a 1')
    .max(99999, 'La cantidad máxima es 99999'),
  reason: z
    .string()
    .trim()
    .min(10, 'La razón debe tener al menos 10 caracteres')
    .max(500, 'La razón debe tener máximo 500 caracteres'),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;