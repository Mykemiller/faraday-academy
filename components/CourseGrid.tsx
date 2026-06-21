"use client";
import type { Course } from "@/lib/types";
import CourseCard from "./CourseCard";
import EmptyState from "./EmptyState";

export default function CourseGrid({
  results,
  catalogEmpty,
  suggestions,
  suggestionLabel,
  onClearAll,
}: {
  results: Course[];
  catalogEmpty: boolean;
  suggestions: Course[];
  suggestionLabel?: string;
  onClearAll: () => void;
}) {
  // Empty (no data) — calm, not an error (spec §10).
  if (catalogEmpty) {
    return (
      <div className="rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card px-6 py-12 text-center">
        <h2 className="font-serif text-xl text-forest">The catalog is being prepared.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-forest-70">
          New courses are on the way. Check back shortly.
        </p>
      </div>
    );
  }

  // No results — invitation with smart suggestions (spec §10 / review #7).
  if (results.length === 0) {
    return (
      <EmptyState
        suggestions={suggestions}
        suggestionLabel={suggestionLabel}
        onClearAll={onClearAll}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {results.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
