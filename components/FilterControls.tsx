"use client";
import type { AuthorVoice, FilterState, Level, Persona } from "@/lib/types";
import type { Facets } from "@/lib/facets";
import { hasActiveFilters } from "@/lib/filters";
import PersonaSwitcher from "./PersonaSwitcher";
import SubjectFilter from "./SubjectFilter";

export interface FilterHandlers {
  setPersona: (p: Persona | null) => void;
  toggleLevel: (l: Level) => void;
  toggleSubject: (s: string) => void;
  setAuthor: (v: AuthorVoice | null) => void;
  setNarrated: (v: boolean) => void;
  clearAll: () => void;
}

const SECTION = "mb-2 font-mono text-xs uppercase tracking-wider text-forest-70";

export default function FilterControls({
  filters,
  facets,
  handlers,
  includePersona = false,
  idPrefix = "rail",
}: {
  filters: FilterState;
  facets: Facets;
  handlers: FilterHandlers;
  includePersona?: boolean;
  idPrefix?: string;
}) {
  const levelSet = new Set(filters.levels);
  return (
    <div className="space-y-6">
      {/* The switcher carries its own role="group" and label, so this section
          uses a heading rather than a fieldset legend — two identically named
          groups would be read twice. */}
      {includePersona && facets.anyPersonas && (
        <div>
          <h2 className={SECTION}>I&apos;m a…</h2>
          <PersonaSwitcher value={filters.persona} onChange={handlers.setPersona} />
        </div>
      )}

      {facets.levels.length > 0 && (
        <fieldset>
          <legend className={SECTION}>Level</legend>
          <div className="flex flex-wrap gap-1.5">
            {facets.levels.map((level) => {
              const active = levelSet.has(level);
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handlers.toggleLevel(level)}
                  className={[
                    "rounded-md border px-3 py-1.5 font-mono text-sm transition-colors",
                    active
                      ? "border-forest bg-forest text-warm-white"
                      : "border-sage-40 bg-warm-white-card text-forest-90 hover:border-sage",
                  ].join(" ")}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.subjectsByCluster.length > 0 && (
        <div>
          <h2 className={SECTION}>Subject</h2>
          <SubjectFilter
            groups={facets.subjectsByCluster}
            selected={filters.subjects}
            onToggle={handlers.toggleSubject}
            idPrefix={`${idPrefix}-subject`}
          />
        </div>
      )}

      {facets.authors.length > 0 && (
        <fieldset>
          <legend className={SECTION}>Author</legend>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Author">
            {[{ voice: null as AuthorVoice | null, name: "Everyone" }, ...facets.authors].map(
              ({ voice, name }) => {
                const active = filters.author === voice;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handlers.setAuthor(voice)}
                    className={[
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-forest bg-forest text-warm-white"
                        : "border-sage-40 bg-warm-white-card text-forest-90 hover:border-sage",
                    ].join(" ")}
                  >
                    {name}
                  </button>
                );
              },
            )}
          </div>
        </fieldset>
      )}

      {facets.anyNarrated && (
        <div>
          <h2 className={SECTION}>Narration</h2>
          <label
            htmlFor={`${idPrefix}-narrated`}
            className="flex cursor-pointer items-center gap-2 text-sm text-forest-90"
          >
            <input
              id={`${idPrefix}-narrated`}
              type="checkbox"
              checked={filters.narrated}
              onChange={(e) => handlers.setNarrated(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-[var(--color-forest)]"
            />
            <span>Narrated only</span>
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={handlers.clearAll}
        disabled={!hasActiveFilters(filters)}
        className="w-full rounded-md border border-sage-40 px-3 py-2 text-sm text-forest-90 transition-colors hover:border-sage disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear all filters
      </button>
    </div>
  );
}
