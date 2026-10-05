"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Chip, SortKey } from "@/lib/types";
import { SORTS } from "@/lib/constants";
import ActiveChips from "./ActiveChips";

// Search + sort + active chips. No result count is rendered: a number here is a
// count of published courses, and the lobby stays count-agnostic. The change is
// announced to assistive tech instead.
export default function Toolbar({
  q,
  onQChange,
  sort,
  onSortChange,
  chips,
  onRemoveChip,
  onClearAll,
  onOpenDrawer,
  drawerTriggerRef,
}: {
  q: string;
  onQChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  chips: Chip[];
  onRemoveChip: (chip: Chip) => void;
  onClearAll: () => void;
  onOpenDrawer: () => void;
  drawerTriggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          ref={drawerTriggerRef}
          type="button"
          onClick={onOpenDrawer}
          className="inline-flex items-center gap-2 rounded-md border border-sage-40 px-3 py-2 text-sm text-forest-90 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
        </button>

        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-70"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search courses"
            aria-label="Search courses"
            className="w-full rounded-md border border-sage-40 bg-warm-white-card py-2 pl-9 pr-3 text-sm text-forest placeholder:text-forest-40 focus:border-sage"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-forest-70">
          <span className="font-mono text-xs uppercase tracking-wider">Sort</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-md border border-sage-40 bg-warm-white-card px-2 py-2 text-sm text-forest focus:border-sage"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <ActiveChips chips={chips} onRemove={onRemoveChip} onClearAll={onClearAll} />
      )}

      <p aria-live="polite" className="sr-only">
        Results updated.
      </p>
    </div>
  );
}
