import { ArrowRight, Clock, Headphones } from "lucide-react";
import type { LobbyCourse } from "@/lib/types";
import { BETA_PRICE_LABEL, formatPrice, formatReadingMinutes } from "@/lib/constants";
import { ClusterIcon } from "./ClusterIcon";

export default function CourseCard({
  course,
  betaFree,
}: {
  course: LobbyCourse;
  betaFree: boolean;
}) {
  const price =
    betaFree || course.priceUSD === null ? BETA_PRICE_LABEL : formatPrice(course.priceUSD);

  return (
    <article className="card-hover flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card">
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-sage-20 px-2.5 py-1 text-[11px] text-forest-90">
            <ClusterIcon cluster={course.cluster} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{course.subject ?? course.cluster}</span>
          </span>
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-wide text-forest-70">
            {course.level}
          </span>
        </div>

        <h3 className="font-serif text-lg leading-snug text-forest">
          <a
            href={course.playerUrl}
            className="text-forest underline-offset-4 hover:underline"
          >
            {course.title}
          </a>
        </h3>

        {course.author && (
          <p className="text-xs text-forest-70">with {course.author.name}</p>
        )}

        {course.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-forest-70">
            {course.description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-forest-90">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatReadingMinutes(course.readingMinutes)}
          </span>
          {course.narrated && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Headphones className="h-3.5 w-3.5" aria-hidden />
                Narrated
              </span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="font-medium text-forest">{price}</span>
        </div>

        <div className="mt-auto pt-3">
          <a
            href={course.playerUrl}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
          >
            Start reading
            <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
