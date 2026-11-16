import { describe, expect, it } from "vitest";
import {
  compareSuppliers,
  normalizeUnit,
  weightsSchema,
  type ComparisonInput,
} from "@/features/comparison/engine";
export const itemId = "11111111-1111-4111-8111-111111111111";
export function fixture(): ComparisonInput {
  return {
    currency: "USD",
    items: [{ id: itemId, description: "Widget", quantity: "3", unit: "ea" }],
    quotes: [1, 2].map((n) => ({
      id: `22222222-2222-4222-8222-22222222222${n}`,
      vendor_name: `Supplier ${n}`,
      currency: "USD",
      status: "received",
      freight_cost: "0",
      tax_amount: "0",
      discount_amount: "0",
      delivery_days: n * 5,
      payment_terms: "Net 30",
      quote_items: [
        {
          rfq_item_id: itemId,
          quantity: "3",
          unit_price: n === 1 ? "0.1" : "0.2",
          unit: "ea",
        },
      ],
    })),
  };
}
describe("supplier comparison", () => {
  it.each([
    ["ea", "each"],
    [" units ", "each"],
    ["UNIDADE", "each"],
    ["cx.", "box"],
    ["caixas", "box"],
    ["kilogram", "kg"],
    ["quilograma", "kg"],
    ["METER", "m"],
    ["metros", "m"],
  ])("normalizes equivalent unit %s", (input, expected) => {
    expect(normalizeUnit(input)).toBe(expected);
  });

  it("keeps unknown units unknown", () => {
    expect(normalizeUnit("pallet")).toBeNull();
    expect(normalizeUnit("")).toBeNull();
  });

  it("does not equate different measurement dimensions", () => {
    expect(normalizeUnit("box")).not.toBe(normalizeUnit("ea"));
    expect(normalizeUnit("kg")).not.toBe(normalizeUnit("m"));
  });

  it("compares equivalent Portuguese and English units", () => {
    const f = fixture();
    f.items[0].unit = " ea. ";
    f.quotes.forEach((quote) => {
      quote.quote_items[0].unit = "UNIDADE";
    });
    const result = compareSuppliers(f);
    expect(result.offers.every((offer) => !offer.issues.includes("unit"))).toBe(true);
    expect(result.offers.every((offer) => offer.complete)).toBe(true);
  });

  it("calculates exact totals, charges and spread", () => {
    const f = fixture();
    f.quotes[0].freight_cost = "0.1";
    f.quotes[0].tax_amount = "0.2";
    f.quotes[0].discount_amount = "0.1";
    const r = compareSuppliers(f);
    expect(r.lowest).toBe("0.5000");
    expect(r.highest).toBe("0.6000");
    expect(r.difference).toBe("0.1000");
  });
  it("distinguishes missing from explicit zero", () => {
    const f = fixture();
    f.quotes[0].freight_cost = null;
    const r = compareSuppliers(f);
    expect(r.lowest).toBeNull();
    expect(
      r.offers.find((o) => o.quote.id === f.quotes[0].id)?.total,
    ).toBeNull();
  });
  it.each(["EUR", null])(
    "does not rank currency %s against USD",
    (currency) => {
      const f = fixture();
      f.quotes[0].currency = currency;
      expect(compareSuppliers(f).lowest).toBeNull();
    },
  );
  it("marks missing items and partial quantities ineligible", () => {
    const f = fixture();
    f.quotes[0].quote_items = [];
    f.quotes[1].quote_items[0].quantity = "1";
    const r = compareSuppliers(f);
    expect(r.comparableCount).toBe(0);
    expect(r.offers.every((o) => o.score === null)).toBe(true);
    expect(r.offers[0].issues).toContain("missingItem");
    expect(r.offers[1].issues).toContain("quantity");
  });
  it("rejects duplicate, unknown and mismatched units from comparisons", () => {
    const f = fixture();
    f.quotes[0].quote_items.push({ ...f.quotes[0].quote_items[0] });
    f.quotes[1].quote_items[0].unit = "box";
    expect(compareSuppliers(f).comparableCount).toBe(0);
    f.quotes[0].quote_items = [
      {
        ...f.quotes[1].quote_items[0],
        rfq_item_id: "99999999-9999-4999-8999-999999999999",
      },
    ];
    expect(compareSuppliers(f).offers[0].issues).toContain("unknownItem");
  });
  it("handles no offers and one offer without a winner", () => {
    const f = fixture();
    f.quotes = [];
    expect(compareSuppliers(f).lowest).toBeNull();
    f.quotes = fixture().quotes.slice(0, 1);
    const r = compareSuppliers(f);
    expect(r.lowest).toBeNull();
    expect(r.offers[0].score).toBeNull();
  });
  it("gives equal values equal scores and stable ID order", () => {
    const f = fixture();
    f.quotes[1] = { ...f.quotes[0], id: f.quotes[1].id };
    f.quotes.reverse();
    const r = compareSuppliers(f);
    expect(r.offers.map((o) => o.score)).toEqual(["100.00", "100.00"]);
    expect(r.offers[0].quote.id).toBe(f.quotes[1].id);
    expect(r.difference).toBe("0.0000");
  });
  it("rejects invalid weights", () => {
    expect(
      weightsSchema.safeParse({ price: 60, delivery: 25, completeness: 20 })
        .success,
    ).toBe(false);
    expect(
      weightsSchema.safeParse({ price: -1, delivery: 1, completeness: 100 })
        .success,
    ).toBe(false);
  });
  it("missing delivery receives zero and no recommendation", () => {
    const f = fixture();
    f.quotes[0].delivery_days = null;
    const o = compareSuppliers(f).offers.find(
      (o) => o.quote.id === f.quotes[0].id,
    )!;
    expect(o.breakdown.delivery).toBe("0.00");
    expect(o.score).toBeNull();
  });
  it("weights change deterministic ranking", () => {
    const f = fixture();
    f.quotes[0].delivery_days = 20;
    expect(
      compareSuppliers(f, { price: 100, delivery: 0, completeness: 0 })
        .offers[0].quote.id,
    ).toBe(f.quotes[0].id);
    expect(
      compareSuppliers(f, { price: 0, delivery: 100, completeness: 0 })
        .offers[0].quote.id,
    ).toBe(f.quotes[1].id);
  });
  it("excludes archived offers and negative totals", () => {
    const f = fixture();
    f.quotes[0].status = "archived";
    f.quotes[1].discount_amount = "100";
    expect(compareSuppliers(f).comparableCount).toBe(0);
  });
  it("handles different items and missing prices explicitly", () => {
    const f = fixture();
    f.items.push({ ...f.items[0], id: "33333333-3333-4333-8333-333333333333" });
    f.quotes[1].quote_items[0].rfq_item_id = f.items[1].id;
    f.quotes[0].quote_items[0].unit_price = null;
    expect(compareSuppliers(f).offers.every((o) => !o.comparable)).toBe(true);
  });
});
