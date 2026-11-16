import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: "a@example.test" } } }),
    },
    from: () => ({ select: mocks.select }),
  }),
}));
vi.mock("@/lib/locale/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
import Page from "@/app/rfqs/[id]/quotes/[quoteId]/page";
it("reads numeric columns as text and displays exact amounts with unknown currency", async () => {
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ eq: mocks.eq, maybeSingle: mocks.maybeSingle });
  mocks.maybeSingle.mockResolvedValue({
    error: null,
    data: {
      id: "quote",
      vendor_name: "Supplier",
      raw_text: "Original",
      currency: null,
      freight_cost: "99999999999999.9999",
      tax_amount: null,
      discount_amount: "0.0000",
      delivery_days: null,
      payment_terms: null,
      status: "pending",
      revision: 1,
      quote_items: [
        {
          id: "line",
          rfq_item_id: "item",
          description: "Widget",
          quantity: "3",
          unit_price: "0.1000",
          unit: "ea",
          line_total: "999",
          rfq_items: { description: "Requested widget" },
        },
      ],
    },
  });
  const html = renderToStaticMarkup(
    await Page({ params: Promise.resolve({ id: "rfq", quoteId: "quote" }) }),
  );
  expect(mocks.select).toHaveBeenCalledWith(
    expect.stringContaining("freight_cost::text"),
  );
  expect(html).toContain("99999999999999.9999");
  expect(html).toContain("Currency not provided 0.3000");
  expect(html).toContain("Not provided");
  expect(html).toContain("Requested widget");
  expect(html).not.toContain("BRL");
  expect(mocks.eq).toHaveBeenCalledWith("rfq_id", "rfq");
});
