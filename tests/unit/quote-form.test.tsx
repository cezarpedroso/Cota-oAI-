// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  createQuote: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/features/quotes/actions", () => ({
  createQuote: mocks.createQuote,
}));
vi.mock("@/features/extraction/actions", () => ({
  extractQuotationAction: vi.fn(),
}));
import { QuoteForm } from "@/components/quote-form";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "11111111-1111-4111-8111-111111111111";
function fill() {
  render(
    <QuoteForm
      rfqId={id}
      items={[{ id, description: "Widget", unit: "ea" }]}
      locale="en"
    />,
  );
  fireEvent.change(screen.getByLabelText("Supplier name"), {
    target: { value: "Supplier" },
  });
  fireEvent.change(screen.getByLabelText("Requested item"), {
    target: { value: id },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Unit price"), {
    target: { value: "0.1" },
  });
}
it("submits validated data and navigates only after persistence", async () => {
  mocks.createQuote.mockResolvedValue({ href: "/saved", error: null });
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Save quotation" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/saved"));
  expect(mocks.createQuote).toHaveBeenCalledWith(
    id,
    expect.objectContaining({
      currency: null,
      freight: null,
      items: [
        expect.objectContaining({
          quantity: "3",
          unitPrice: "0.1",
          lineTotal: "0.3000",
        }),
      ],
    }),
  );
});
it("shows persistence failures and keeps the user on the form", async () => {
  mocks.createQuote.mockResolvedValue({ href: null, error: "save" });
  fill();
  fireEvent.click(screen.getByRole("button", { name: "Save quotation" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("Unable to save"),
  );
  expect(mocks.push).not.toHaveBeenCalled();
});
it("requires valid quantities and supports dynamic lines", async () => {
  fill();
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save quotation" }));
  await waitFor(() =>
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
  );
  expect(mocks.createQuote).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Add line" }));
  expect(screen.getAllByLabelText("Requested item")).toHaveLength(2);
  fireEvent.click(screen.getAllByRole("button", { name: "Remove line" })[1]);
  expect(screen.getAllByLabelText("Requested item")).toHaveLength(1);
});
