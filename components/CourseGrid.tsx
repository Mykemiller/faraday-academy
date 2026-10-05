import type { LobbyCourse } from "@/lib/types";
import CourseCard from "./CourseCard";
import EmptyState from "./EmptyState";

export default function CourseGrid({
  results,
  betaFree,
  offline = false,
  onClearAll,
}: {
  results: LobbyCourse[];
  betaFree: boolean;
  offline?: boolean;
  onClearAll?: () => void;
}) {
  // No catalog at all: neither the live function nor the snapshot answered.
  if (offline) {
    return (
      <div className="rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card px-6 py-12 text-center">
        <h2 className="font-serif text-xl text-forest">The catalog is offline right now.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-forest-70">
          Reading is unaffected — this page just cannot list the courses at the moment.
          Reload in a minute.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return <EmptyState onClearAll={onClearAll} />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {results.map((course) => (
        <CourseCard key={course.slug} course={course} betaFree={betaFree} />
      ))}
    </div>
  );
}
