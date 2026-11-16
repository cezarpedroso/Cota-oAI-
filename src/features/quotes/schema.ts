import { z } from "zod";
import { lineTotal, optionalDecimal, positiveDecimal } from "@/lib/money";

export const quoteSchema = z.object({
  vendorName: z.string().trim().min(1).max(160),
  rawText: z.string().max(30000).optional(),
  currency: z
    .enum(["BRL", "USD", ""])
    .nullable()
    .transform((v) => v || null),
  freight: optionalDecimal,
  tax: optionalDecimal,
  discount: optionalDecimal,
  delivery: z
    .union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(36500)])
    .transform((v) => (v === "" ? null : v)),
  paymentTerms: z.string().max(4000).optional(),
  items: z
    .array(
      z
        .object({
          rfqItemId: z.string().uuid(),
          description: z.string().max(4000).optional(),
          quantity: positiveDecimal,
          unitPrice: optionalDecimal,
          unit: z.string().trim().max(80).optional(),
        })
        .transform((item, ctx) => {
          try {
            return {
              ...item,
              lineTotal: lineTotal(item.quantity, item.unitPrice),
            };
          } catch {
            ctx.addIssue({
              code: "custom",
              message: "Line total exceeds allowed precision",
            });
            return z.NEVER;
          }
        }),
    )
    .min(1)
    .max(200)
    .refine(
      (items) => new Set(items.map((i) => i.rfqItemId)).size === items.length,
      "Duplicate RFQ item",
    ),
});
