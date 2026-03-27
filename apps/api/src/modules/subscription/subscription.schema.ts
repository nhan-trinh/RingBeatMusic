import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    plan: z.enum(['PREMIUM_INDIVIDUAL', 'PREMIUM_DUO', 'PREMIUM_FAMILY', 'PREMIUM_STUDENT']),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>['body'];
