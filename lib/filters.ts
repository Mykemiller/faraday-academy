// PURE, dependency-free filter/sort/chips core (spec §7). Unit-tested.
// UI components never re-implement this logic.
import type {
  Course, FilterState, SortKey, Persona, Chip, DurationFilterValue,
} from "./types";

export function bucket(d: number): DurationFilterValue {
  return d < 60 ? "lt60" : d <= 180 ? "60to180" : "gt180";
}

export function matchText(c: Course, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === "") return true;
  return `${c.title} ${c.description} ${c.school.name}`
    .toLowerCase()
    .includes(needle);
}

// AND across groups; OR within the School multi-select (spec §7.2).
export function applyFilters(courses: Course[], f: FilterState): Course[] {
  return courses.filter(
    (c) =>
      (f.persona == null || c.personas.includes(f.persona)) &&
      (f.schools.length === 0 || f.schools.includes(c.school.id)) &&
      (f.price === "all" || (f.price === "free" ? c.isFree : !c.isFree)) &&
      (f.duration === "any" || bucket(c.durationMinutes) === f.duration) &&
      (!f.certOnly || c.isCertification) &&
      matchText(c, f.q),
  );
}

export function applySort(
  courses: Course[],
  sort: SortKey,
  persona: Persona | null,
): Course[] {
  const out = [...courses];
  const byRecent = (a: Course, b: Course) =>
    b.updatedAt.localeCompare(a.updatedAt);
  switch (sort) {
    case "recommended":
      // Persona matches first, then most-recently updated. Stable, no fabricated rank.
      return out.sort((a, b) => {
        if (persona) {
          const am = a.personas.includes(persona) ? 0 : 1;
          const bm = b.personas.includes(persona) ? 0 : 1;
          if (am !== bm) return am - bm;
        }
        return byRecent(a, b);
      });
    case "recent":
      return out.sort(byRecent);
    case "shortest":
      return out.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case "longest":
      return out.sort((a, b) => b.durationMinutes - a.durationMinutes);
    case "title":
      return out.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return out;
  }
}

// Active-filter chips for the toolbar. schoolName resolves school ids to labels.
export function activeChips(
  f: FilterState,
  schoolName: (id: string) => string,
): Chip[] {
  const chips: Chip[] = [];
  if (f.persona) {
    chips.push({ key: `persona`, label: `I'm a ${f.persona}`, kind: "persona" });
  }
  for (const id of f.schools) {
    chips.push({ key: `school:${id}`, label: schoolName(id), kind: "school", value: id });
  }
  if (f.price !== "all") {
    chips.push({ key: "price", label: f.price === "free" ? "Free" : "Paid", kind: "price" });
  }
  if (f.duration !== "any") {
    const label =
      f.duration === "lt60" ? "Under 1 hour"
        : f.duration === "60to180" ? "1–3 hours" : "3+ hours";
    chips.push({ key: "duration", label, kind: "duration" });
  }
  if (f.certOnly) {
    chips.push({ key: "cert", label: "Certifications", kind: "cert" });
  }
  if (f.q.trim() !== "") {
    chips.push({ key: "q", label: `“${f.q.trim()}”`, kind: "q" });
  }
  return chips;
}

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.persona != null ||
    f.schools.length > 0 ||
    f.price !== "all" ||
    f.duration !== "any" ||
    f.certOnly ||
    f.q.trim() !== ""
  );
}
