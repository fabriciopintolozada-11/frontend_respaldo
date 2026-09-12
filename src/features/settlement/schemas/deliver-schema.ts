import { z } from 'zod';

// US-20 / RN-21: delivery payload. Mirrors the backend DeliverWorkOrderDto
// bounds. No monetary amount is present: the total is always computed by the
// backend from the approved quote (BE-13).
export const deliveryPaymentMethodEnum = z.enum(
  ['CASH', 'QR_TRANSFER', 'CARD'],
  { error: 'Seleccione un método de pago.' },
);

export const deliverSchema = z.object({
  paymentMethod: deliveryPaymentMethodEnum,
  receiptNumber: z
    .string({ error: 'Ingresa el número de comprobante.' })
    .trim()
    .min(1, 'Ingresa el número de comprobante.')
    .max(50, 'Máximo 50 caracteres'),
  deliveryNotes: z
    .string()
    .trim()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
});

export type DeliverFormValues = z.infer<typeof deliverSchema>;