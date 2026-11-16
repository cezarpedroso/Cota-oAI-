import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { extractQuotation } from "../../src/lib/openrouter";

const valid = { supplierName: "Acme", currency: "USD", freight: null, taxes: null, discount: null, deliveryDays: null, paymentTerms: null, notes: null, items: [{ description: "Widget", quantity: "2", unit: "ea", unitPrice: "1.25" }] };
function mockResponse(body: unknown, ok = true) { vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => body })); }
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("OpenRouter extraction", () => {
  it("validates a structured response and preserves missing values as null", async () => { vi.stubEnv("OPENROUTER_API_KEY", "test"); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", "test-model"); mockResponse({ choices: [{ message: { content: JSON.stringify(valid) } }] }); await expect(extractQuotation("supplier text")).resolves.toEqual(valid); });
  it("rejects malformed JSON", async () => { vi.stubEnv("OPENROUTER_API_KEY", "test"); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", "test-model"); mockResponse({ choices: [{ message: { content: "not json" } }] }); await expect(extractQuotation("x")).rejects.toThrow("malformed JSON"); });
  it("rejects schema-invalid output", async () => { vi.stubEnv("OPENROUTER_API_KEY", "test"); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", "test-model"); const invalid = { ...valid, items: [{ description: "x", quantity: "invented", unit: null, unitPrice: null }] }; mockResponse({ choices: [{ message: { content: JSON.stringify(invalid) } }] }); await expect(extractQuotation("x")).rejects.toThrow(); });
  it("handles HTTP failures", async () => { vi.stubEnv("OPENROUTER_API_KEY", "test"); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", "test-model"); mockResponse({}, false); await expect(extractQuotation("x")).rejects.toThrow("request failed"); });
  it("requires configuration", async () => { vi.stubEnv("OPENROUTER_API_KEY", ""); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", ""); vi.stubEnv("OPENROUTER_PRIMARY_MODEL", ""); await expect(extractQuotation("x")).rejects.toThrow("not configured"); });
  it("surfaces request failures without database writes", async () => { vi.stubEnv("OPENROUTER_API_KEY", "test"); vi.stubEnv("OPENROUTER_MODEL_PRIMARY", "test-model"); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout"))); await expect(extractQuotation("x")).rejects.toThrow("timeout"); expect(fetch).toHaveBeenCalledTimes(1); });
});
