// Loading placeholders with the same grid footprint as the real cards (spec §10).
export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card p-5">
      <div className="skeleton mb-4 h-24 w-full rounded-md" />
      <div className="skeleton mb-3 h-3 w-1/3 rounded" />
      <div className="skeleton mb-2 h-5 w-3/4 rounded" />
      <div className="skeleton mb-2 h-3 w-full rounded" />
      <div className="skeleton mb-5 h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
