"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthorVoice, Chip, FilterState, Level, LobbyCatalog } from "@/lib/types";
import { applyFilters, applySort } from "@/lib/filters";
import { activeChips } from "@/lib/filters";
import { parseFilters, serializeFilters } from "@/lib/url";
import { DEFAULT_FILTERS } from "@/lib/constants";
import { facetsFor } from "@/lib/facets";
import type { FilterHandlers } from "./FilterControls";
import FilterRail from "./FilterRail";
import FilterDrawer from "./FilterDrawer";
import PersonaSwitcher from "./PersonaSwitcher";
import Toolbar from "./Toolbar";
import CourseGrid from "./CourseGrid";

/**
 * Deliberately does NOT call useSearchParams.
 *
 * On a prerendered route that hook forces the client tree up to the nearest
 * Suspense boundary to be client-side rendered, which is exactly what produced
 * a lobby whose HTML was skeletons and whose 99 player links existed only after
 * hydration — invisible to a crawler and to a reader on a slow connection.
 *
 * Instead the server renders the unfiltered grid, the shell hydrates with the
 * same default state (so the markup matches), and the URL is read once on mount
 * and on popstate. Writes go through window.history.replaceState, which Next
 * integrates with its router without a navigation round trip.
 */
export default function LobbyShell({ catalog }: { catalog: LobbyCatalog }) {
  const facets = useMemo(() => facetsFor(catalog.courses), [catalog.courses]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const readUrl = useRef(false);

  const subjects = facets.subjects;

  // Read the URL after hydration, and again on back/forward.
  useEffect(() => {
    const fromUrl = () =>
      setFilters(parseFilters(new URLSearchParams(window.location.search), subjects));
    fromUrl();
    readUrl.current = true;
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
  }, [subjects]);

  // Mirror filter state back to the URL so a view is shareable.
  const serialized = useMemo(() => serializeFilters(filters).toString(), [filters]);
  useEffect(() => {
    if (!readUrl.current) return;
    const current = window.location.search.replace(/^\?/, "");
    if (serialized === current) return;
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${serialized ? `?${serialized}` : ""}`,
    );
  }, [serialized]);

  const results = useMemo(
    () => applySort(applyFilters(catalog.courses, filters), filters.sort, filters.persona),
    [catalog.courses, filters],
  );

  const chips = useMemo(() => activeChips(filters), [filters]);

  const handlers: FilterHandlers = useMemo(
    () => ({
      setPersona: (persona) => setFilters((f) => ({ ...f, persona })),
      toggleLevel: (level: Level) =>
        setFilters((f) => ({
          ...f,
          levels: f.levels.includes(level)
            ? f.levels.filter((l) => l !== level)
            : [...f.levels, level],
        })),
      toggleSubject: (subject: string) =>
        setFilters((f) => ({
          ...f,
          subjects: f.subjects.includes(subject)
            ? f.subjects.filter((s) => s !== subject)
            : [...f.subjects, subject],
        })),
      setAuthor: (author: AuthorVoice | null) => setFilters((f) => ({ ...f, author })),
      setNarrated: (narrated: boolean) => setFilters((f) => ({ ...f, narrated })),
      clearAll: () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort })),
    }),
    [],
  );

  const removeChip = useCallback((chip: Chip) => {
    setFilters((f) => {
      switch (chip.kind) {
        case "persona": return { ...f, persona: null };
        case "level": return { ...f, levels: f.levels.filter((l) => l !== chip.value) };
        case "subject": return { ...f, subjects: f.subjects.filter((s) => s !== chip.value) };
        case "author": return { ...f, author: null };
        case "narrated": return { ...f, narrated: false };
        case "q": return { ...f, q: "" };
        default: return f;
      }
    });
  }, []);

  return (
    <div className="min-h-full">
      <header className="border-b border-sage-20 bg-warm-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-2xl text-forest sm:text-3xl">Faraday Academy</h1>
              <p className="mt-1 max-w-xl text-sm text-forest-70">
                Short, sharp courses on the forces shaping the AI data center economy —
                power, cooling, capital, grid policy, and sovereign compute.
              </p>
              <p className="mt-2 max-w-xl text-sm text-forest-90">
                Every lesson is open to read. Free during beta.
              </p>
            </div>
            {facets.anyPersonas && (
              <div className="hidden lg:block">
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
                  I&apos;m a…
                </p>
                <PersonaSwitcher value={filters.persona} onChange={handlers.setPersona} />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <FilterRail filters={filters} facets={facets} handlers={handlers} />

          <div className="min-w-0 flex-1 space-y-5">
            {/* The grid needs a level-2 heading of its own: on a phone the filter
                rail is display:none, so without this the document jumps h1 → h3. */}
            <h2 className="sr-only">Courses</h2>
            <Toolbar
              q={filters.q}
              onQChange={(q) => setFilters((f) => ({ ...f, q }))}
              sort={filters.sort}
              onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
              chips={chips}
              onRemoveChip={removeChip}
              onClearAll={handlers.clearAll}
              onOpenDrawer={() => setDrawerOpen(true)}
              drawerTriggerRef={drawerTriggerRef}
            />

            <CourseGrid
              results={results}
              betaFree={catalog.beta.free}
              offline={catalog.courses.length === 0}
              onClearAll={handlers.clearAll}
            />
          </div>
        </div>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        facets={facets}
        handlers={handlers}
        triggerRef={drawerTriggerRef}
      />
    </div>
  );
}
