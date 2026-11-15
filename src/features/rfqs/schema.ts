import { z } from "zod";
export const rfqSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional(),
  currency: z.enum(["BRL", "USD"]),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1),
        quantity: z.coerce.number().positive(),
        unit: z.string().trim().min(1),
        specifications: z.string().optional(),
      }),
    )
    .min(1),
});
