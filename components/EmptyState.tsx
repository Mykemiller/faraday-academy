"use client";

// No-results invitation, not a dead end.
export default function EmptyState({ onClearAll }: { onClearAll?: () => void }) {
  return (
    <div className="animate-fade-in rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card px-6 py-10 text-center">
      <h2 className="font-serif text-xl text-forest">Nothing matches these filters.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-forest-70">
        Widen a filter to see more, or clear them all to browse everything.
      </p>
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="mt-4 rounded-md bg-forest px-4 py-2 text-sm font-medium text-warm-white"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
