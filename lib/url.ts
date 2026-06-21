// FilterState ⇄ URLSearchParams (spec §7.3). Defaults are omitted from the URL.
import type { FilterState, Persona, SortKey, PriceFilterValue, DurationFilterValue } from "./types";
import { DEFAULT_FILTERS, PERSONAS, SORTS, SCHOOLS } from "./constants";

const VALID_SCHOOL_IDS = new Set(SCHOOLS.map((s) => s.id));
const VALID_SORTS = new Set(SORTS.map((s) => s.key));
const VALID_PRICE: PriceFilterValue[] = ["all", "free", "paid"];
const VALID_DURATION: DurationFilterValue[] = ["any", "lt60", "60to180", "gt180"];

export function parseFilters(params: URLSearchParams): FilterState {
  const personaRaw = params.get("persona");
  const persona = (PERSONAS as string[]).includes(personaRaw ?? "")
    ? (personaRaw as Persona)
    : null;

  const schools = (params.get("schools") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_SCHOOL_IDS.has(s));

  const priceRaw = params.get("price") as PriceFilterValue | null;
  const price = priceRaw && VALID_PRICE.includes(priceRaw) ? priceRaw : "all";

  const durationRaw = params.get("duration") as DurationFilterValue | null;
  const duration = durationRaw && VALID_DURATION.includes(durationRaw) ? durationRaw : "any";

  const sortRaw = params.get("sort") as SortKey | null;
  const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : "recommended";

  return {
    persona,
    schools,
    price,
    duration,
    certOnly: params.get("cert") === "1",
    q: params.get("q") ?? "",
    sort,
  };
}

export function serializeFilters(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.persona) p.set("persona", f.persona);
  if (f.schools.length) p.set("schools", f.schools.join(","));
  if (f.price !== DEFAULT_FILTERS.price) p.set("price", f.price);
  if (f.duration !== DEFAULT_FILTERS.duration) p.set("duration", f.duration);
  if (f.certOnly) p.set("cert", "1");
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  return p;
}

export function filtersToQueryString(f: FilterState): string {
  const s = serializeFilters(f).toString();
  return s ? `?${s}` : "";
}
