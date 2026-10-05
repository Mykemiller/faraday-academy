import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import FilterControls, { type FilterHandlers } from "@/components/FilterControls";
import { facetsFor } from "@/lib/facets";
import { toLobbyCatalog } from "@/lib/catalog";
import { validateCatalog } from "@/lib/academy-public";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterState } from "@/lib/types";
import fixture from "./fixtures/catalog.json";

const courses = toLobbyCatalog(
  validateCatalog(structuredClone(fixture))!,
  "live",
  "https://www.faraday-player.com",
).courses;
const facets = facetsFor(courses);

function setup(filters: Partial<FilterState> = {}) {
  const handlers: FilterHandlers = {
    setPersona: vi.fn(),
    toggleLevel: vi.fn(),
    toggleSubject: vi.fn(),
    setAuthor: vi.fn(),
    setNarrated: vi.fn(),
    clearAll: vi.fn(),
  };
  const view = render(
    <FilterControls
      filters={{ ...DEFAULT_FILTERS, ...filters }}
      facets={facets}
      handlers={handlers}
      includePersona
    />,
  );
  return { handlers, ...view };
}

describe("FilterControls", () => {
  it("offers Level, Subject, Author and Narration — and nothing retired", () => {
    const { container } = setup();
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Author")).toBeInTheDocument();
    expect(screen.getByText("Narration")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/price|duration|certif|school/i);
  });

  it("lists only the levels and subjects the catalog actually publishes", () => {
    setup();
    for (const level of facets.levels) {
      expect(screen.getByRole("button", { name: level })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "401" })).toBeNull();
    expect(screen.getByLabelText("Power Architecture")).toBeInTheDocument();
  });

  it("groups subjects by cluster", () => {
    setup();
    expect(screen.getByText("Physical Stack")).toBeInTheDocument();
    expect(screen.getByText("Cross-Stack")).toBeInTheDocument();
    expect(screen.queryByText("Market & Policy")).toBeNull();
  });

  it("names both authors by name, never by voice key", () => {
    const { container } = setup();
    expect(screen.getByRole("button", { name: "Mach Eigen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gilbert Faraday" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bgil\b|\bmach\b/);
  });

  it("reports selection through aria-pressed and checked, not a count badge", () => {
    const { container } = setup({ levels: ["101"], subjects: ["Power Architecture"] });
    expect(screen.getByRole("button", { name: "101" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Power Architecture")).toBeChecked();
    expect(container.textContent).not.toMatch(/\(\d+\)/);
  });

  it("toggles a level, a subject, an author and narration", async () => {
    const user = userEvent.setup();
    const { handlers } = setup();
    await user.click(screen.getByRole("button", { name: "101" }));
    expect(handlers.toggleLevel).toHaveBeenCalledWith("101");
    await user.click(screen.getByLabelText("Power Architecture"));
    expect(handlers.toggleSubject).toHaveBeenCalledWith("Power Architecture");
    await user.click(screen.getByRole("button", { name: "Mach Eigen" }));
    expect(handlers.setAuthor).toHaveBeenCalledWith("mach");
    await user.click(screen.getByLabelText("Narrated only"));
    expect(handlers.setNarrated).toHaveBeenCalledWith(true);
  });

  it("disables Clear all until something is set", async () => {
    const user = userEvent.setup();
    const { handlers, rerender } = setup();
    const clear = screen.getByRole("button", { name: /clear all filters/i });
    expect(clear).toBeDisabled();
    rerender(
      <FilterControls
        filters={{ ...DEFAULT_FILTERS, narrated: true }}
        facets={facets}
        handlers={handlers}
        includePersona
      />,
    );
    await user.click(screen.getByRole("button", { name: /clear all filters/i }));
    expect(handlers.clearAll).toHaveBeenCalled();
  });

  it("hides the persona switcher when no course carries personas", () => {
    setup();
    expect(screen.queryByRole("group", { name: "I'm a…" })).toBeNull();
  });

  it("shows the persona switcher when the catalog carries personas", () => {
    const withPersonas = courses.map((c) => ({ ...c, personas: ["Operator" as const] }));
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        facets={facetsFor(withPersonas)}
        handlers={{
          setPersona: vi.fn(), toggleLevel: vi.fn(), toggleSubject: vi.fn(),
          setAuthor: vi.fn(), setNarrated: vi.fn(), clearAll: vi.fn(),
        }}
        includePersona
      />,
    );
    expect(screen.getByRole("group", { name: "I'm a…" })).toBeInTheDocument();
  });

  it("is axe clean", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
