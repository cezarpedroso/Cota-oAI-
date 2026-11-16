import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const m = vi.hoisted(() => ({
  getUser: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: m.getUser }, from: m.from }),
}));
import { loadComparison } from "@/features/comparison/load";
const id = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  vi.clearAllMocks();
  m.getUser.mockResolvedValue({
    data: { user: { id, email: "a@example.test" } },
    error: null,
  });
  m.from.mockReturnValue({ select: m.select });
  m.select.mockReturnValue({ eq: m.eq });
  m.eq.mockReturnValue({ eq: m.eq, maybeSingle: m.maybeSingle });
});
it("blocks unauthenticated users before querying records", async () => {
  m.getUser.mockResolvedValue({ data: { user: null } });
  expect((await loadComparison(id)).kind).toBe("unauthenticated");
  expect(m.from).not.toHaveBeenCalled();
});
it("uses both owner and RFQ filters and hides inaccessible RFQs", async () => {
  m.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await loadComparison(id)).kind).toBe("missing");
  expect(m.eq).toHaveBeenCalledWith("user_id", id);
  expect(m.eq).toHaveBeenCalledWith("id", id);
});
it("rejects malformed identifiers", async () => {
  expect((await loadComparison("invalid")).kind).toBe("missing");
  expect(m.from).not.toHaveBeenCalled();
});
it("separates failed queries from empty quotations", async () => {
  m.maybeSingle.mockResolvedValue({ error: { message: "secret" }, data: null });
  expect(await loadComparison(id)).toEqual({ kind: "error" });
});
it("loads valid empty RFQs with exact text numeric selection", async () => {
  m.maybeSingle.mockResolvedValue({
    data: { title: "Test", currency: "USD", rfq_items: [], vendor_quotes: [] },
    error: null,
  });
  expect((await loadComparison(id)).kind).toBe("success");
  expect(m.select).toHaveBeenCalledWith(
    expect.stringContaining("unit_price::text"),
  );
});
