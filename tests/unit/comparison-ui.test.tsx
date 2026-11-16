// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SupplierComparison } from "@/components/supplier-comparison";
afterEach(cleanup);
it("shows bilingual empty states and validates weight sums", () => {
  const { unmount } = render(
    <SupplierComparison
      rfqId="test"
      locale="en"
      data={{ currency: "USD", items: [], quotes: [] }}
    />,
  );
  expect(screen.getByText(/No quotations yet/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "50" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply weights" }));
  expect(screen.getByRole("alert").textContent).toContain("100");
  unmount();
  render(
    <SupplierComparison
      rfqId="test"
      locale="pt-BR"
      data={{ currency: "BRL", items: [], quotes: [] }}
    />,
  );
  expect(screen.getByText(/Ainda não há cotações/)).toBeTruthy();
});
