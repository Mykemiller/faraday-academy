"use client";
import type { FilterState } from "@/lib/types";
import FilterControls, { type FilterHandlers } from "./FilterControls";

// Desktop sticky rail (lg+). Persona lives in the header on desktop.
export default function FilterRail({
  filters,
  handlers,
}: {
  filters: FilterState;
  handlers: FilterHandlers;
}) {
  return (
    <aside
      aria-label="Filters"
      className="hidden lg:block lg:w-72 lg:shrink-0"
    >
      <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
        <FilterControls filters={filters} handlers={handlers} idPrefix="rail" />
      </div>
    </aside>
  );
}
