import { z } from 'zod';

export const QUOTE_ITEM_TYPES = ['LABOR', 'PART'] as const;
export type QuoteItemType = z.infer<typeof quoteItemTypeSchema>;

export const quoteItemTypeSchema = z.enum(QUOTE_ITEM_TYPES);

const descriptionSchema = z
  .string()
  .trim()
  .min(3, 'La descripción debe tener al menos 3 caracteres.');

export const laborItemSchema = z
  .object({
    itemType: z.literal('LABOR'),
    description: descriptionSchema,
    quantity: z.number().positive('La cantidad de horas debe ser mayor a 0.'),
  })
  .strict();

export const partItemSchema = z
  .object({
    itemType: z.literal('PART'),
    description: descriptionSchema,
    quantity: z
      .number()
      .int('La cantidad de un repuesto debe ser un número entero.')
      .positive('La cantidad debe ser mayor a 0.'),
    sparePartId: z.string().min(1, 'Selecciona un repuesto válido del catálogo.'),
  })
  .strict();

// FE-T12.3: FE-12 validation contract for quote items.
// PART requires an integer quantity > 0 and a sparePartId; LABOR accepts
// decimal quantities and never carries a sparePartId.
export const quoteItemSchema = z.discriminatedUnion('itemType', [laborItemSchema, partItemSchema]);

export const quoteItemsSchema = z
  .array(quoteItemSchema)
  .min(1, 'Agrega al menos un ítem al presupuesto.');

export const quoteFormSchema = z.object({
  items: quoteItemsSchema,
});

export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;