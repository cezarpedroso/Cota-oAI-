import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ failed: false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { email: "user@example.test" } } }),
    },
    from: () => ({
      select: () => {
        const result = {
          count: mocks.failed ? null : 0,
          data: [],
          error: mocks.failed ? { message: "private failure" } : null,
        };
        return {
          ...result,
          eq: () => result,
          order: () => ({ limit: async () => result }),
        };
      },
    }),
  }),
}));
vi.mock("@/lib/locale/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
import Dashboard from "@/app/dashboard/page";
beforeEach(() => {
  mocks.failed = false;
});
it("shows errors instead of misleading empty statistics", async () => {
  mocks.failed = true;
  const html = renderToStaticMarkup(await Dashboard());
  expect(html).toContain("Dashboard unavailable");
  expect(html).not.toContain("private failure");
  expect(html).not.toContain("text-3xl");
});
it("renders actual zero counts for successful empty queries", async () => {
  const html = renderToStaticMarkup(await Dashboard());
  expect(html).not.toContain("Dashboard unavailable");
  expect(html).toContain(">0<");
});
