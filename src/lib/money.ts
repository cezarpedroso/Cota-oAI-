import Decimal from "decimal.js";
import { z } from "zod";
const PreciseDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});
export const decimalString = z
  .string()
  .trim()
  .regex(/^\d{1,14}(\.\d{1,4})?$/)
  .transform((value) => new Decimal(value).toFixed());
export const optionalDecimal = z
  .union([decimalString, z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));
export const positiveDecimal = decimalString.refine((value) =>
  new Decimal(value).gt(0),
);
export function lineTotal(
  quantity: string | null,
  price: string | null,
): string | null {
  if (quantity === null || price === null) return null;
  const total = new PreciseDecimal(quantity)
    .mul(price)
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  if (total.gte("100000000000000"))
    throw new Error("Line total exceeds database precision");
  return total.toFixed(4);
}
export function formatMoney(
  value: string | null,
  currency: string | null,
  locale = "en",
) {
  if (value === null) return locale === "en" ? "Not provided" : "Não informado";
  const amount = new Decimal(value).toFixed(4);
  return `${currency ?? (locale === "en" ? "Currency not provided" : "Moeda não informada")} ${locale === "en" ? amount : amount.replace(".", ",")}`;
}
