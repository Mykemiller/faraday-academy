import { Clock, ArrowRight, Award, Star } from "lucide-react";
import type { Cluster, Course } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/constants";
import { ClusterIcon } from "./ClusterIcon";

// Restrained, low-glare tints derived from forest/sage/gold (spec §9.1) — not five loud colors.
const TILE_TINT: Record<Cluster, string> = {
  "Physical Stack": "#e7ede6",
  "Commercial & Capital": "#efe7d6",
  "Market & Policy": "#e3e9ea",
  "Operations & Resilience": "#e9ece4",
  "Cross-Stack": "#e8eae9",
};

export default function CourseCard({ course }: { course: Course }) {
  const { school } = course;
  const shownPersonas = course.personas.slice(0, 3);
  const extraPersonas = course.personas.length - shownPersonas.length;

  return (
    <article className="card-hover flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-sage-20 bg-warm-white-card">
      {/* Thumbnail or monogram tile (degrades gracefully — spec §10). */}
      <div
        className="relative flex h-24 items-center justify-center"
        style={{ backgroundColor: TILE_TINT[school.cluster] }}
        aria-hidden
      >
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center gap-2 text-forest-70">
            <ClusterIcon cluster={school.cluster} className="h-6 w-6" />
            <span className="font-mono text-lg font-medium text-forest">{school.id}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {/* School · Level badge + optional cert badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-20 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-forest-90">
            <ClusterIcon cluster={school.cluster} className="h-3.5 w-3.5" />
            {school.name} · {course.level}
          </span>
          {course.isCertification && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-forest">
              <Award className="h-3 w-3 text-gold" aria-hidden />
              Cert
            </span>
          )}
        </div>

        <h3 className="font-serif text-lg leading-snug text-forest">{course.title}</h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-forest-70">
          {course.description}
        </p>

        {/* Metadata in mono — the editorial tell (spec §9.2) */}
        <div className="mt-1 flex items-center gap-3 font-mono text-xs text-forest-90">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDuration(course.durationMinutes)}
          </span>
          <span aria-hidden>·</span>
          <span className={course.isFree ? "font-medium text-forest" : ""}>
            {formatPrice(course.priceUSD)}
          </span>
          {course.rating != null && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                {course.rating.toFixed(1)}
                {course.ratingCount != null && (
                  <span className="text-forest-70">({course.ratingCount})</span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Persona tags (max 3 + N) */}
        {shownPersonas.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {shownPersonas.map((p) => (
              <li
                key={p}
                className="rounded border border-sage-20 px-1.5 py-0.5 text-[11px] text-forest-70"
              >
                {p}
              </li>
            ))}
            {extraPersonas > 0 && (
              <li className="rounded px-1.5 py-0.5 text-[11px] text-forest-70">
                +{extraPersonas}
              </li>
            )}
          </ul>
        )}

        {/* Theme pills — read-only, high-signal context (review #4) */}
        {course.themes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {course.themes.map((t) => (
              <li
                key={t}
                className="rounded-full bg-sage-20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-forest-70"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* CTA — link when present, else disabled "Coming soon" (spec §4/§10) */}
        <div className="mt-auto pt-3">
          {course.url ? (
            <a
              href={course.url}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-forest underline-offset-4 hover:underline"
            >
              View course
              <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-40"
            >
              Coming soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
