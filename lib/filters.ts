// Pure, dependency-free filter/sort/chip core. The UI never re-implements it.
import type { Chip, FilterState, LobbyCourse, Persona, SortKey } from "./types";
import { LEVEL_ORDER, personaPhrase } from "./constants";

export function matchText(c: LobbyCourse, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === "") return true;
  return `${c.title} ${c.subject ?? ""}`.toLowerCase().includes(needle);
}

/** AND across groups; OR inside the Level and Subject multi-selects. */
export function applyFilters(courses: LobbyCourse[], f: FilterState): LobbyCourse[] {
  return courses.filter(
    (c) =>
      (f.levels.length === 0 || f.levels.includes(c.level)) &&
      (f.subjects.length === 0 || (c.subject !== null && f.subjects.includes(c.subject))) &&
      (f.author === null || c.author?.voice === f.author) &&
      (!f.narrated || c.narrated) &&
      matchText(c, f.q),
  );
}

/**
 * A persona never hides a course — it only lifts matching courses to the front,
 * and only when the catalog actually carries persona data.
 */
export function applySort(
  courses: LobbyCourse[],
  sort: SortKey,
  persona: Persona | null = null,
): LobbyCourse[] {
  const byTitle = (a: LobbyCourse, b: LobbyCourse) => a.title.localeCompare(b.title);
  const ranked = [...courses].sort((a, b) => {
    switch (sort) {
      case "title":
        return byTitle(a, b);
      case "shortest":
        return a.readingMinutes - b.readingMinutes || byTitle(a, b);
      case "longest":
        return b.readingMinutes - a.readingMinutes || byTitle(a, b);
      case "recommended":
      default:
        return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || byTitle(a, b);
    }
  });

  if (!persona) return ranked;
  return ranked.sort((a, b) => {
    const am = a.personas?.includes(persona) ? 0 : 1;
    const bm = b.personas?.includes(persona) ? 0 : 1;
    return am - bm;
  });
}

export function authorLabel(voice: "gil" | "mach"): string {
  return voice === "gil" ? "Gilbert Faraday" : "Mach Eigen";
}

export function activeChips(f: FilterState): Chip[] {
  const chips: Chip[] = [];
  if (f.persona) chips.push({ key: "persona", label: personaPhrase(f.persona), kind: "persona" });
  for (const level of f.levels) {
    chips.push({ key: `level:${level}`, label: `Level ${level}`, kind: "level", value: level });
  }
  for (const subject of f.subjects) {
    chips.push({ key: `subject:${subject}`, label: subject, kind: "subject", value: subject });
  }
  if (f.author) {
    chips.push({ key: "author", label: authorLabel(f.author), kind: "author" });
  }
  if (f.narrated) chips.push({ key: "narrated", label: "Narrated", kind: "narrated" });
  if (f.q.trim() !== "") chips.push({ key: "q", label: `“${f.q.trim()}”`, kind: "q" });
  return chips;
}

export function hasActiveFilters(f: FilterState): boolean {
  return (
    f.levels.length > 0 ||
    f.subjects.length > 0 ||
    f.author !== null ||
    f.narrated ||
    f.q.trim() !== "" ||
    f.persona !== null
  );
}
