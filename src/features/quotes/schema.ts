import { z } from "zod";
const nullableMoney = z
  .union([z.literal(""), z.coerce.number().nonnegative()])
  .transform((v) => (v === "" ? null : v));
export const quoteSchema = z.object({
  vendorName: z.string().trim().min(1),
  rawText: z.string().optional(),
  currency: z.enum(["BRL", "USD"]),
  freight: nullableMoney,
  tax: nullableMoney,
  discount: nullableMoney,
  delivery: z
    .union([z.literal(""), z.coerce.number().int().nonnegative()])
    .transform((v) => (v === "" ? null : v)),
  paymentTerms: z.string().optional(),
  items: z
    .array(
      z.object({
        rfqItemId: z.string().uuid(),
        description: z.string().optional(),
        quantity: z.coerce.number().positive(),
        unitPrice: nullableMoney,
        unit: z.string().optional(),
        lineTotal: nullableMoney,
      }),
    )
    .min(1),
});
