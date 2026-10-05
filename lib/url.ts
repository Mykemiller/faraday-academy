// FilterState ⇄ URLSearchParams. Defaults are omitted from the URL, and the
// retired params (persona-as-gate, price, duration, cert, schools) are ignored
// in silence so an old bookmark still lands on a working lobby.
//
// Level and Subject repeat the key rather than comma-joining: subject names
// contain commas ("Tax, Incentives & Fiscal Policy") and would not survive a
// split.

import type { AuthorVoice, FilterState, Level, Persona, SortKey } from "./types";
import { AUTHOR_VOICES, DEFAULT_FILTERS, LEVELS, PERSONAS, SORTS } from "./constants";

const VALID_LEVELS = new Set<string>(LEVELS);
const VALID_SORTS = new Set<string>(SORTS.map((s) => s.key));
const VALID_VOICES = new Set<string>(AUTHOR_VOICES);
const VALID_PERSONAS = new Set<string>(PERSONAS);

/** Subjects are validated against the catalog in hand, never a hard-coded list. */
export function parseFilters(
  params: URLSearchParams,
  knownSubjects: readonly string[] = [],
): FilterState {
  const subjectSet = new Set(knownSubjects);

  const levels = params
    .getAll("level")
    .filter((v) => VALID_LEVELS.has(v)) as Level[];

  const subjects = params
    .getAll("subject")
    .filter((v) => subjectSet.size === 0 || subjectSet.has(v));

  const authorRaw = params.get("author");
  const author = authorRaw && VALID_VOICES.has(authorRaw) ? (authorRaw as AuthorVoice) : null;

  const sortRaw = params.get("sort");
  const sort = sortRaw && VALID_SORTS.has(sortRaw) ? (sortRaw as SortKey) : DEFAULT_FILTERS.sort;

  const personaRaw = params.get("persona");
  const persona = personaRaw && VALID_PERSONAS.has(personaRaw) ? (personaRaw as Persona) : null;

  return {
    levels: [...new Set(levels)],
    subjects: [...new Set(subjects)],
    author,
    narrated: params.get("narrated") === "1",
    q: params.get("q") ?? "",
    sort,
    persona,
  };
}

export function serializeFilters(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  for (const level of f.levels) p.append("level", level);
  for (const subject of f.subjects) p.append("subject", subject);
  if (f.author) p.set("author", f.author);
  if (f.narrated) p.set("narrated", "1");
  if (f.q.trim() !== "") p.set("q", f.q.trim());
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  if (f.persona) p.set("persona", f.persona);
  return p;
}
