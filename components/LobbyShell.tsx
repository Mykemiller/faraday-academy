"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  Course, FilterState, Persona, Chip, PriceFilterValue, DurationFilterValue,
} from "@/lib/types";
import { applyFilters, applySort, activeChips } from "@/lib/filters";
import { parseFilters, serializeFilters } from "@/lib/url";
import { SCHOOLS, DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterHandlers } from "./FilterControls";
import FilterRail from "./FilterRail";
import FilterDrawer from "./FilterDrawer";
import PersonaSwitcher from "./PersonaSwitcher";
import Toolbar from "./Toolbar";
import CourseGrid from "./CourseGrid";

const PERSONA_STORAGE_KEY = "faraday-academy-persona";
const schoolName = (id: string) => SCHOOLS.find((s) => s.id === id)?.name ?? id;

// Compute closest matches by relaxing the most-restrictive single filter (review #7).
function computeSuggestions(
  catalog: Course[],
  f: FilterState,
): { list: Course[]; label?: string } {
  const relaxations: { next: FilterState; label: string }[] = [];
  if (f.duration !== "any") relaxations.push({ next: { ...f, duration: "any" }, label: "with any duration" });
  if (f.certOnly) relaxations.push({ next: { ...f, certOnly: false }, label: "beyond certifications" });
  if (f.price !== "all") relaxations.push({ next: { ...f, price: "all" }, label: "at any price" });
  if (f.schools.length) relaxations.push({ next: { ...f, schools: [] }, label: "across all schools" });
  if (f.persona) relaxations.push({ next: { ...f, persona: null }, label: "for any persona" });

  for (const r of relaxations) {
    const matches = applySort(applyFilters(catalog, r.next), "recommended", f.persona);
    if (matches.length > 0) {
      return { list: matches.slice(0, 3), label: `Closest matches — ${r.label}` };
    }
  }
  return { list: [] };
}

export default function LobbyShell({ catalog }: { catalog: Course[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const hydratedPersona = useRef(false);

  // One-time: if the URL carried no persona, hydrate from localStorage (review #5).
  useEffect(() => {
    if (hydratedPersona.current) return;
    hydratedPersona.current = true;
    if (filters.persona == null && !searchParams.get("persona")) {
      const stored = localStorage.getItem(PERSONA_STORAGE_KEY) as Persona | null;
      if (stored) setFilters((f) => ({ ...f, persona: stored }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist persona + mirror filter state to the URL (shareable, back/forward safe — spec §7.3).
  useEffect(() => {
    if (filters.persona) localStorage.setItem(PERSONA_STORAGE_KEY, filters.persona);
    else localStorage.removeItem(PERSONA_STORAGE_KEY);

    const next = serializeFilters(filters).toString();
    const current = serializeFilters(
      parseFilters(new URLSearchParams(searchParams.toString())),
    ).toString();
    if (next !== current) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const results = useMemo(
    () => applySort(applyFilters(catalog, filters), filters.sort, filters.persona),
    [catalog, filters],
  );

  const suggestions = useMemo(
    () => (results.length === 0 ? computeSuggestions(catalog, filters) : { list: [] }),
    [catalog, filters, results.length],
  );

  const chips = useMemo(() => activeChips(filters, schoolName), [filters]);

  const handlers: FilterHandlers = useMemo(
    () => ({
      setPersona: (persona) => setFilters((f) => ({ ...f, persona })),
      toggleSchool: (id) =>
        setFilters((f) => ({
          ...f,
          schools: f.schools.includes(id)
            ? f.schools.filter((s) => s !== id)
            : [...f.schools, id],
        })),
      setPrice: (price: PriceFilterValue) => setFilters((f) => ({ ...f, price })),
      setDuration: (duration: DurationFilterValue) => setFilters((f) => ({ ...f, duration })),
      setCertOnly: (certOnly) => setFilters((f) => ({ ...f, certOnly })),
      clearAll: () => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort })),
    }),
    [],
  );

  const removeChip = useCallback((chip: Chip) => {
    setFilters((f) => {
      switch (chip.kind) {
        case "persona": return { ...f, persona: null };
        case "school": return { ...f, schools: f.schools.filter((s) => s !== chip.value) };
        case "price": return { ...f, price: "all" };
        case "duration": return { ...f, duration: "any" };
        case "cert": return { ...f, certOnly: false };
        case "q": return { ...f, q: "" };
        default: return f;
      }
    });
  }, []);

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-sage-20 bg-warm-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-serif text-2xl text-forest sm:text-3xl">Faraday Academy</h1>
              <p className="mt-1 max-w-xl text-sm text-forest-70">
                Short, sharp courses on the forces shaping the AI data center economy —
                power, cooling, capital, grid policy, and sovereign compute.
              </p>
            </div>
            <div className="hidden lg:block">
              <p className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
                I&apos;m a…
              </p>
              <PersonaSwitcher value={filters.persona} onChange={handlers.setPersona} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <FilterRail filters={filters} handlers={handlers} />

          <div className="min-w-0 flex-1 space-y-5">
            <Toolbar
              q={filters.q}
              onQChange={(q) => setFilters((f) => ({ ...f, q }))}
              sort={filters.sort}
              onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
              resultCount={results.length}
              chips={chips}
              onRemoveChip={removeChip}
              onClearAll={handlers.clearAll}
              onOpenDrawer={() => setDrawerOpen(true)}
              drawerTriggerRef={drawerTriggerRef}
            />

            <div key={results.length} className="animate-fade-in">
              <CourseGrid
                results={results}
                catalogEmpty={catalog.length === 0}
                suggestions={suggestions.list}
                suggestionLabel={suggestions.label}
                onClearAll={handlers.clearAll}
              />
            </div>
          </div>
        </div>
      </main>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        handlers={handlers}
        resultCount={results.length}
        triggerRef={drawerTriggerRef}
      />
    </div>
  );
}
