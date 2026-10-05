"use client";
import { ClusterIcon } from "./ClusterIcon";
import type { Facets } from "@/lib/facets";

// Subjects grouped by cluster. OR within the selection; no counts anywhere.
export default function SubjectFilter({
  groups,
  selected,
  onToggle,
  idPrefix = "subject",
}: {
  groups: Facets["subjectsByCluster"];
  selected: string[];
  onToggle: (subject: string) => void;
  idPrefix?: string;
}) {
  const set = new Set(selected);
  return (
    <div className="space-y-1">
      {groups.map(({ cluster, subjects }, i) => {
        const anySelected = subjects.some((s) => set.has(s));
        return (
          <details
            key={cluster}
            open={i === 0 || anySelected}
            className="rounded-md border border-sage-20 bg-warm-white-card"
          >
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium text-forest marker:content-['']">
              <span className="text-forest-70">
                <ClusterIcon cluster={cluster} />
              </span>
              {cluster}
            </summary>
            <ul className="px-3 pb-2.5 pt-0.5">
              {subjects.map((subject) => {
                const id = `${idPrefix}-${subject.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
                return (
                  <li key={subject}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-forest-90 hover:text-forest"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={set.has(subject)}
                        onChange={() => onToggle(subject)}
                        className="h-4 w-4 shrink-0 accent-[var(--color-forest)]"
                      />
                      <span>{subject}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
