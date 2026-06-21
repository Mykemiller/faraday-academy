import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import FilterControls, { type FilterHandlers } from "@/components/FilterControls";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterState } from "@/lib/types";

function setup(over: Partial<FilterState> = {}) {
  const handlers: FilterHandlers = {
    setPersona: vi.fn(), toggleSchool: vi.fn(), setPrice: vi.fn(),
    setDuration: vi.fn(), setCertOnly: vi.fn(), clearAll: vi.fn(),
  };
  const filters = { ...DEFAULT_FILTERS, ...over };
  const utils = render(
    <FilterControls filters={filters} handlers={handlers} includePersona idPrefix="t" />,
  );
  return { handlers, ...utils };
}

describe("FilterControls", () => {
  it("toggling a School checkbox calls toggleSchool with its id", async () => {
    const { handlers } = setup();
    await userEvent.click(screen.getByLabelText("Power Architecture"));
    expect(handlers.toggleSchool).toHaveBeenCalledWith("D2");
  });

  it("selecting a persona calls setPersona", async () => {
    const { handlers } = setup();
    await userEvent.click(screen.getByRole("button", { name: "I'm a Investor" }));
    expect(handlers.setPersona).toHaveBeenCalledWith("Investor");
  });

  it("Price segmented control calls setPrice", async () => {
    const { handlers } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Free" }));
    expect(handlers.setPrice).toHaveBeenCalledWith("free");
  });

  it("Certifications switch toggles", async () => {
    const { handlers } = setup();
    await userEvent.click(screen.getByRole("switch", { name: /certifications only/i }));
    expect(handlers.setCertOnly).toHaveBeenCalledWith(true);
  });

  it("Clear all is disabled with no active filters, enabled otherwise", () => {
    const { rerender } = render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        handlers={{ setPersona: vi.fn(), toggleSchool: vi.fn(), setPrice: vi.fn(), setDuration: vi.fn(), setCertOnly: vi.fn(), clearAll: vi.fn() }}
        idPrefix="t2"
      />,
    );
    expect(screen.getByRole("button", { name: /clear all filters/i })).toBeDisabled();
    rerender(
      <FilterControls
        filters={{ ...DEFAULT_FILTERS, certOnly: true }}
        handlers={{ setPersona: vi.fn(), toggleSchool: vi.fn(), setPrice: vi.fn(), setDuration: vi.fn(), setCertOnly: vi.fn(), clearAll: vi.fn() }}
        idPrefix="t2"
      />,
    );
    expect(screen.getByRole("button", { name: /clear all filters/i })).toBeEnabled();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
