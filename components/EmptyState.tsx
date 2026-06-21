"use client";
import type { Course } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/constants";

// No-results invitation, not a dead end (spec §10). Smart suggestions (review #7):
// when nothing matches, surface the closest available courses with one filter relaxed.
export default function EmptyState({
  suggestions,
  suggestionLabel,
  onClearAll,
}: {
  suggestions: Course[];
  suggestionLabel?: string;
  onClearAll: () => void;
}) {
  return (
    <div className="animate-fade-in rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card px-6 py-10 text-center">
      <h2 className="font-serif text-xl text-forest">No courses match these filters.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-forest-70">
        Adjust a filter to widen the search, or clear them all to see the full catalog.
      </p>
      <button
        type="button"
        onClick={onClearAll}
        className="mt-4 rounded-md bg-forest px-4 py-2 text-sm font-medium text-warm-white"
      >
        Clear all filters
      </button>

      {suggestions.length > 0 && (
        <div className="mx-auto mt-8 max-w-xl text-left">
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-wider text-forest-70">
            {suggestionLabel ?? "Closest matches"}
          </p>
          <ul className="space-y-2">
            {suggestions.map((c) => {
              const meta = `${c.school.name} · ${formatDuration(c.durationMinutes)} · ${formatPrice(c.priceUSD)}`;
              const inner = (
                <>
                  <span className="font-serif text-forest">{c.title}</span>
                  <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-forest-70">
                    {meta}
                  </span>
                </>
              );
              return (
                <li key={c.id}>
                  {c.url ? (
                    <a
                      href={c.url}
                      className="block rounded-md border border-sage-20 bg-warm-white px-4 py-2.5 transition-colors hover:border-sage"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="block rounded-md border border-sage-20 bg-warm-white px-4 py-2.5">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
