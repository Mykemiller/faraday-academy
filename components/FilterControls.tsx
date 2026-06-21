"use client";
import type { FilterState, Persona, PriceFilterValue, DurationFilterValue } from "@/lib/types";
import { hasActiveFilters } from "@/lib/filters";
import PersonaSwitcher from "./PersonaSwitcher";
import SchoolFilter from "./SchoolFilter";
import PriceFilter from "./PriceFilter";
import DurationFilter from "./DurationFilter";
import CertToggle from "./CertToggle";

export interface FilterHandlers {
  setPersona: (p: Persona | null) => void;
  toggleSchool: (id: string) => void;
  setPrice: (v: PriceFilterValue) => void;
  setDuration: (v: DurationFilterValue) => void;
  setCertOnly: (v: boolean) => void;
  clearAll: () => void;
}

export default function FilterControls({
  filters,
  handlers,
  includePersona = false,
  idPrefix = "rail",
}: {
  filters: FilterState;
  handlers: FilterHandlers;
  includePersona?: boolean;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-6">
      {includePersona && (
        <fieldset>
          <legend className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
            I&apos;m a…
          </legend>
          <PersonaSwitcher
            value={filters.persona}
            onChange={handlers.setPersona}
            idPrefix={`${idPrefix}-persona`}
          />
        </fieldset>
      )}

      <div>
        <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
          School
        </h3>
        <SchoolFilter
          selected={filters.schools}
          onToggle={handlers.toggleSchool}
          idPrefix={`${idPrefix}-school`}
        />
      </div>

      <PriceFilter value={filters.price} onChange={handlers.setPrice} />
      <DurationFilter value={filters.duration} onChange={handlers.setDuration} />

      <div>
        <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
          Certification
        </h3>
        <CertToggle value={filters.certOnly} onChange={handlers.setCertOnly} />
      </div>

      <button
        type="button"
        onClick={handlers.clearAll}
        disabled={!hasActiveFilters(filters)}
        className="w-full rounded-md border border-sage-40 px-3 py-2 text-sm text-forest-90 transition-colors hover:border-sage disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear all filters
      </button>
    </div>
  );
}
