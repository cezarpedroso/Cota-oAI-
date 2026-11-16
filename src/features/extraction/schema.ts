import { z } from "zod";

const decimal = z
  .string()
  .regex(/^\d+(\.\d+)?$/)
  .nullable();
export const extractionSchema = z.object({
  supplierName: z.string().nullable(),
  currency: z.enum(["BRL", "USD"]).nullable(),
  freight: decimal,
  taxes: decimal,
  discount: decimal,
  deliveryDays: z.number().int().nonnegative().nullable(),
  paymentTerms: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: decimal,
      unit: z.string().nullable(),
      unitPrice: decimal,
    }),
  ),
});
export type Extraction = z.infer<typeof extractionSchema>;
