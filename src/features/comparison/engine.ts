import Decimal from "decimal.js";
import { z } from "zod";
import { decimalString, lineTotal, positiveDecimal } from "@/lib/money";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
const money = decimalString.nullable();
export const comparisonSchema = z.object({
  currency: z.string(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      description: z.string(),
      quantity: positiveDecimal,
      unit: z.string(),
    }),
  ),
  quotes: z.array(
    z.object({
      id: z.string().uuid(),
      vendor_name: z.string(),
      currency: z.string().nullable(),
      status: z.string(),
      freight_cost: money,
      tax_amount: money,
      discount_amount: money,
      delivery_days: z.number().int().nonnegative().nullable(),
      payment_terms: z.string().nullable(),
      quote_items: z.array(
        z.object({
          rfq_item_id: z.string().uuid(),
          quantity: positiveDecimal.nullable(),
          unit_price: money,
          unit: z.string().nullable(),
        }),
      ),
    }),
  ),
});
export type ComparisonInput = z.infer<typeof comparisonSchema>;
export const weightsSchema = z
  .object({
    price: z.number().int().min(0).max(100),
    delivery: z.number().int().min(0).max(100),
    completeness: z.number().int().min(0).max(100),
  })
  .refine(
    (w) => w.price + w.delivery + w.completeness === 100,
    "Weights must total 100%",
  );
export const defaultWeights = { price: 60, delivery: 25, completeness: 15 };
export type Weights = z.infer<typeof weightsSchema>;
export type Issue =
  | "missingItem"
  | "duplicateItem"
  | "quantity"
  | "unit"
  | "price"
  | "unknownItem"
  | "charges"
  | "currency"
  | "delivery"
  | "payment"
  | "archived"
  | "overflow"
  | "negativeTotal";

export function compareSuppliers(
  raw: ComparisonInput,
  weights: Weights = defaultWeights,
) {
  const input = comparisonSchema.parse(raw);
  const w = weightsSchema.parse(weights);
  const offers = input.quotes.map((quote) => {
    const issues = new Set<Issue>();
    let knownSubtotal = new D(0);
    const rows = input.items.map((item) => {
      const matches = quote.quote_items.filter(
        (line) => line.rfq_item_id === item.id,
      );
      const line = matches.length === 1 ? matches[0] : null;
      if (!matches.length) issues.add("missingItem");
      if (matches.length > 1) issues.add("duplicateItem");
      let total: string | null = null;
      if (line) {
        if (line.quantity === null || !new D(line.quantity).eq(item.quantity))
          issues.add("quantity");
        if (
          !line.unit ||
          line.unit.trim().toLowerCase() !== item.unit.trim().toLowerCase()
        )
          issues.add("unit");
        if (line.unit_price === null) issues.add("price");
        try {
          total = lineTotal(line.quantity, line.unit_price);
        } catch {
          issues.add("overflow");
        }
        if (total !== null) knownSubtotal = knownSubtotal.plus(total);
      }
      return { item, line, total };
    });
    if (
      quote.quote_items.some(
        (line) => !input.items.some((i) => i.id === line.rfq_item_id),
      )
    )
      issues.add("unknownItem");
    if (
      [quote.freight_cost, quote.tax_amount, quote.discount_amount].some(
        (v) => v === null,
      )
    )
      issues.add("charges");
    if (!quote.currency || quote.currency !== input.currency)
      issues.add("currency");
    if (quote.delivery_days === null) issues.add("delivery");
    if (!quote.payment_terms?.trim()) issues.add("payment");
    if (quote.status === "archived") issues.add("archived");
    const subtotal =
      rows.every((r) => r.total !== null) && !issues.has("unknownItem")
        ? knownSubtotal.toFixed(4)
        : null;
    let total: string | null = null;
    if (
      subtotal !== null &&
      quote.freight_cost !== null &&
      quote.tax_amount !== null &&
      quote.discount_amount !== null
    ) {
      const computed = new D(subtotal)
        .plus(quote.freight_cost)
        .plus(quote.tax_amount)
        .minus(quote.discount_amount);
      if (computed.isNegative()) issues.add("negativeTotal");
      else total = computed.toFixed(4);
    }
    const financialIssues = [...issues].filter(
      (i) => i !== "delivery" && i !== "payment",
    );
    const comparable =
      input.items.length > 0 && total !== null && financialIssues.length === 0;
    // Exact requested-item fulfillment + six known commercial fields.
    const fulfilled = rows.filter(
      (r) =>
        r.line &&
        r.total !== null &&
        r.line.quantity !== null &&
        new D(r.line.quantity).eq(r.item.quantity) &&
        r.line.unit?.trim().toLowerCase() === r.item.unit.trim().toLowerCase(),
    ).length;
    const knownTerms = [
      quote.currency,
      quote.freight_cost,
      quote.tax_amount,
      quote.discount_amount,
      quote.delivery_days,
      quote.payment_terms?.trim() || null,
    ].filter((v) => v !== null).length;
    const completeness = new D(fulfilled + knownTerms)
      .div(input.items.length + 6)
      .mul(100);
    return {
      quote,
      rows,
      issues: [...issues],
      comparable,
      complete: comparable && issues.size === 0,
      coverage: input.items.length
        ? new D(rows.filter((r) => r.line).length)
            .div(input.items.length)
            .mul(100)
            .toFixed(1)
        : "0.0",
      subtotal,
      knownSubtotal: knownSubtotal.toFixed(4),
      total,
      completeness: completeness.toFixed(2),
    };
  });
  const pool = offers.filter((o) => o.comparable);
  const prices = pool.map((o) => new D(o.total ?? "0"));
  const comparable = pool.length >= 2;
  const lowest = comparable ? D.min(...prices) : null;
  const highest = comparable ? D.max(...prices) : null;
  const deliveries = pool.flatMap((o) =>
    o.quote.delivery_days === null ? [] : [new D(o.quote.delivery_days)],
  );
  const normalize = (value: Decimal, values: Decimal[]) => {
    const min = D.min(...values),
      max = D.max(...values);
    return min.eq(max)
      ? new D(100)
      : max.minus(value).div(max.minus(min)).mul(100);
  };
  const scored = offers.map((o) => {
    const price =
      comparable && o.comparable
        ? normalize(new D(o.total ?? "0"), prices)
        : new D(0);
    const delivery =
      o.comparable && o.quote.delivery_days !== null && deliveries.length
        ? normalize(new D(o.quote.delivery_days), deliveries)
        : new D(0);
    const completeness = new D(o.completeness);
    const score = price
      .mul(w.price)
      .plus(delivery.mul(w.delivery))
      .plus(completeness.mul(w.completeness))
      .div(100);
    const eligible = comparable && o.complete;
    return {
      ...o,
      eligible,
      score: eligible ? score.toFixed(2) : null,
      breakdown: {
        price: price.toFixed(2),
        delivery: delivery.toFixed(2),
        completeness: completeness.toFixed(2),
      },
      lowest:
        comparable && o.comparable && new D(o.total ?? "0").eq(lowest ?? 0),
    };
  });
  // Tie order is reproducible, without pretending equally-scored offers differ.
  scored.sort((a, b) =>
    a.score === null
      ? b.score === null
        ? a.quote.id.localeCompare(b.quote.id)
        : 1
      : b.score === null
        ? -1
        : new D(b.score).cmp(a.score) || a.quote.id.localeCompare(b.quote.id),
  );
  return {
    offers: scored,
    completeCount: offers.filter((o) => o.complete).length,
    lowest: lowest?.toFixed(4) ?? null,
    highest: highest?.toFixed(4) ?? null,
    difference: lowest && highest ? highest.minus(lowest).toFixed(4) : null,
    comparableCount: pool.length,
    weights: w,
  };
}
