"use client";
import { CLUSTERS, SCHOOLS_BY_CLUSTER } from "@/lib/constants";
import { ClusterIcon } from "./ClusterIcon";

// Cluster-grouped, collapsible checklist (spec §4). OR within selection.
export default function SchoolFilter({
  selected,
  onToggle,
  idPrefix = "school",
}: {
  selected: string[];
  onToggle: (id: string) => void;
  idPrefix?: string;
}) {
  const set = new Set(selected);
  return (
    <div className="space-y-1">
      {CLUSTERS.map((cluster, i) => {
        const schools = SCHOOLS_BY_CLUSTER[cluster];
        const count = schools.filter((s) => set.has(s.id)).length;
        return (
          <details
            key={cluster}
            open={i === 0 || count > 0}
            className="rounded-md border border-sage-20 bg-warm-white-card"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-forest marker:content-['']">
              <span className="flex items-center gap-2">
                <span className="text-forest-70">
                  <ClusterIcon cluster={cluster} />
                </span>
                {cluster}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-forest px-2 py-0.5 font-mono text-[11px] text-warm-white">
                  {count}
                </span>
              )}
            </summary>
            <ul className="px-3 pb-2.5 pt-0.5">
              {schools.map((s) => {
                const id = `${idPrefix}-${s.id}`;
                const checked = set.has(s.id);
                return (
                  <li key={s.id}>
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-forest-90 hover:text-forest"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(s.id)}
                        className="h-4 w-4 shrink-0 accent-[var(--color-forest)]"
                      />
                      <span>{s.name}</span>
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
