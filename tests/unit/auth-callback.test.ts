import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
    },
  }),
}));

import { GET } from "../../src/app/auth/callback/route";

afterEach(() => {
  mocks.exchangeCodeForSession.mockReset();
});

describe("auth callback", () => {
  it("redirects a successful code exchange to the local dashboard path", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request("https://quote.example/auth/callback?code=valid-code"),
    );

    expect(response.headers.get("location")).toBe(
      "https://quote.example/dashboard",
    );
  });

  it("redirects a failed code exchange to a safe login error", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "expired" },
    });

    const response = await GET(
      new Request("https://quote.example/auth/callback?code=expired-code"),
    );

    expect(response.headers.get("location")).toBe(
      "https://quote.example/login?error=invalid_confirmation_link",
    );
  });

  it("handles an unexpected exchange failure without exposing its details", async () => {
    mocks.exchangeCodeForSession.mockRejectedValue(
      new Error("provider failure"),
    );

    const response = await GET(
      new Request("https://quote.example/auth/callback?code=broken-code"),
    );

    expect(response.headers.get("location")).toBe(
      "https://quote.example/login?error=invalid_confirmation_link",
    );
  });

  it("rejects callbacks with no exchange code", async () => {
    const response = await GET(
      new Request("https://quote.example/auth/callback"),
    );

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://quote.example/login?error=invalid_confirmation_link",
    );
  });
});
