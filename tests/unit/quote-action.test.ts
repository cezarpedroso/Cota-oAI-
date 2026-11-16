import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
      }),
    }),
    rpc: mocks.rpc,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { createQuote } from "@/features/quotes/actions";
const id = "11111111-1111-4111-8111-111111111111";
const input = {
  vendorName: "Supplier",
  currency: "",
  freight: "99999999999999.9999",
  tax: "",
  discount: "",
  delivery: "",
  items: [{ rfqItemId: id, quantity: "2", unitPrice: "1.25" }],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { id }, error: null });
  mocks.rpc.mockResolvedValue({ data: id, error: null });
});
it("saves once through the atomic RPC with exact decimals and returns detail navigation", async () => {
  expect((await createQuote(id, input)).href).toBe(`/rfqs/${id}/quotes/${id}`);
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
  expect(mocks.rpc).toHaveBeenCalledWith(
    "create_quote_atomic",
    expect.objectContaining({
      p_freight: "99999999999999.9999",
      p_tax: null,
      p_currency: null,
      p_items: [expect.objectContaining({ lineTotal: "2.5000" })],
    }),
  );
});
it("rejects unauthorized ownership without invoking RPC", async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await createQuote(id, input)).error).toBe("unauthorized");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rejects unauthenticated sessions", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  expect((await createQuote(id, input)).error).toBe("unauthorized");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rejects malformed input without writes", async () => {
  expect((await createQuote(id, "{")).error).toBe("invalid");
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("never navigates after failed persistence", async () => {
  mocks.rpc.mockResolvedValue({
    data: null,
    error: { message: "private database details" },
  });
  expect(await createQuote(id, input)).toEqual({ href: null, error: "save" });
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
});
