import { describe, expect, it } from "vitest";
import {
  decimalString,
  formatMoney,
  lineTotal,
  optionalDecimal,
} from "@/lib/money";
import { quoteSchema } from "@/features/quotes/schema";
const input = {
  vendorName: "Supplier",
  currency: "",
  freight: "",
  tax: null,
  discount: "0",
  delivery: "",
  items: [
    {
      rfqItemId: "11111111-1111-4111-8111-111111111111",
      quantity: "3",
      unitPrice: "0.1",
    },
  ],
};
describe("precise quotation values", () => {
  it("preserves values beyond Number precision", () =>
    expect(decimalString.parse("99999999999999.9999")).toBe(
      "99999999999999.9999",
    ));
  it("multiplies exactly", () => expect(lineTotal("3", "0.1")).toBe("0.3000"));
  it("preserves large product precision", () =>
    expect(lineTotal("99999999999999.9999", "0.9999")).toBe(
      "99989999999999.9999",
    ));
  it("rounds half up at database scale", () =>
    expect(lineTotal("0.0001", "0.5")).toBe("0.0001"));
  it("keeps missing prices distinct from zero", () => {
    expect(lineTotal("2", null)).toBeNull();
    expect(lineTotal("2", "0")).toBe("0.0000");
  });
  it("rejects precision overflow", () =>
    expect(() => lineTotal("99999999999999", "2")).toThrow());
  it.each(["NaN", "Infinity", "-1", "1e3", "1.00001", "100000000000000"])(
    "rejects invalid decimal %s",
    (value) => expect(decimalString.safeParse(value).success).toBe(false),
  );
  it("does not coerce null into zero", () =>
    expect(optionalDecimal.parse(null)).toBeNull());
  it("calculates totals and preserves unknown currency", () => {
    const result = quoteSchema.parse(input);
    expect(result.currency).toBeNull();
    expect(result.freight).toBeNull();
    expect(result.discount).toBe("0");
    expect(result.items[0].lineTotal).toBe("0.3000");
  });
  it("ignores a forged total", () =>
    expect(
      quoteSchema.parse({
        ...input,
        items: [{ ...input.items[0], lineTotal: "999" }],
      }).items[0].lineTotal,
    ).toBe("0.3000"));
  it("rejects duplicate associations and zero quantity", () => {
    expect(
      quoteSchema.safeParse({
        ...input,
        items: [input.items[0], input.items[0]],
      }).success,
    ).toBe(false);
    expect(
      quoteSchema.safeParse({
        ...input,
        items: [{ ...input.items[0], quantity: "0" }],
      }).success,
    ).toBe(false);
  });
  it("labels unknown currency without assuming BRL", () =>
    expect(formatMoney("1.25", null)).toBe("Currency not provided 1.2500"));
});
