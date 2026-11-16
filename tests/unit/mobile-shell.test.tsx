import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/lib/locale/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/lib/auth/actions", () => ({ logout: vi.fn() }));
vi.mock("@/components/language-toggle", () => ({
  LanguageToggle: () => <span>English</span>,
}));
import { AppShell } from "@/components/app-shell";
it("provides English mobile navigation and logout", async () => {
  const html = renderToStaticMarkup(
    await AppShell({ email: "a@example.test", children: <p>Content</p> }),
  );
  expect(html).toContain('aria-label="Mobile navigation"');
  expect(html).toContain('href="/rfqs"');
  expect(html).toContain("Sign out");
});
