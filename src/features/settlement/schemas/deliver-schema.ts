import { z } from 'zod';

// US-20 / RN-21: delivery payload. Mirrors the backend DeliverWorkOrderDto
// bounds. No monetary amount is submitted: the charged total is always
// computed by the backend from the approved quote (BE-13). receivedAmount is
// a local-only visual helper for cash payments (FE-T20.1: change calculation).
export const deliveryPaymentMethodEnum = z.enum(
  ['CASH', 'QR_TRANSFER', 'CARD'],
  { error: 'Seleccione un método de pago.' },
);

function parseLocalAmount(value: string | undefined): number {
  if (!value) return Number.NaN;
  return Number(value.trim().replace(',', '.'));
}

// The schema is created per modal so the cash "mount received" validation can
// compare against the current total to charge (FE-T20.1).
export function createDeliverSchema(totalToCharge: number) {
  return z
    .object({
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
      receivedAmount: z.string().trim().optional().or(z.literal('')),
    })
    .superRefine((value, ctx) => {
      if (value.paymentMethod !== 'CASH') return;
      const received = parseLocalAmount(value.receivedAmount);
      if (!Number.isFinite(received)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['receivedAmount'],
          message: 'Ingresa el monto recibido.',
        });
      } else if (received < totalToCharge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['receivedAmount'],
          message: 'El monto recibido es menor al total a cobrar.',
        });
      }
    });
}

export type DeliverFormValues = z.infer<ReturnType<typeof createDeliverSchema>>;