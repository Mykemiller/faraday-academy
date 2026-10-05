// Server-only read path onto the academy-public edge function.
//
// The lobby has no database credentials and no Airtable key: the published
// catalog is whatever this function says it is, and the function serves only
// rows whose status is approved or published. Validation is hand-written on
// purpose — a schema library would be a new dependency for one shape.
//
// Not importable from a Client Component: ACADEMY_PUBLIC_BASE is a server env
// var, so a client import would silently read undefined. Fail loudly instead.
if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  throw new Error("lib/academy-public.ts is server-only; do not import it from a Client Component");
}

import type { AuthorVoice, Level, Persona } from "./types";
import { PERSONAS } from "./constants";

export const DEFAULT_ACADEMY_PUBLIC_BASE =
  "https://ycadmmngkdhvpcsrcuaq.supabase.co/functions/v1/academy-public";

export const ACADEMY_TAG = "academy";
export const ACADEMY_REVALIDATE_SECONDS = 300;

export function academyPublicBase(): string {
  const raw = process.env.ACADEMY_PUBLIC_BASE?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_ACADEMY_PUBLIC_BASE).replace(/\/+$/, "");
}

/** The wire shape. `code` is read but deliberately dropped — it is never rendered. */
export interface RawCourse {
  slug: string;
  title: string;
  level: Level;
  author: { voice: AuthorVoice; name: string } | null;
  group: string | null;
  reading_minutes: number;
  narrated: boolean;
  price_usd?: number | null;
  summary?: string | null;
  personas?: Persona[] | null;
}

export interface RawCatalog {
  generated_at: string;
  beta: { free: boolean };
  courses: RawCourse[];
}

const LEVELS = new Set<string>(["101", "201", "301", "401", "X", "Capstone"]);
const VOICES = new Set<string>(["gil", "mach"]);
const PERSONA_SET = new Set<string>(PERSONAS);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Returns the validated row, or a reason string naming the first failure. */
export function validateCourse(input: unknown): RawCourse | string {
  if (!isObject(input)) return "row is not an object";
  if (!nonEmptyString(input.slug)) return "slug missing or empty";
  if (!nonEmptyString(input.title)) return "title missing or empty";
  if (typeof input.level !== "string" || !LEVELS.has(input.level)) {
    return `level ${JSON.stringify(input.level)} is not a known level`;
  }
  if (typeof input.reading_minutes !== "number" || !Number.isFinite(input.reading_minutes)
      || input.reading_minutes <= 0) {
    return "reading_minutes is not a positive number";
  }
  if (typeof input.narrated !== "boolean") return "narrated is not a boolean";

  let author: RawCourse["author"] = null;
  if (input.author != null) {
    if (!isObject(input.author)) return "author is neither null nor an object";
    if (typeof input.author.voice !== "string" || !VOICES.has(input.author.voice)) {
      return `author.voice ${JSON.stringify(input.author.voice)} is not a known voice`;
    }
    if (!nonEmptyString(input.author.name)) return "author.name missing or empty";
    author = { voice: input.author.voice as AuthorVoice, name: input.author.name };
  }

  if (input.group != null && !nonEmptyString(input.group)) {
    return "group is neither null nor a non-empty string";
  }

  let priceUSD: number | null | undefined;
  if (input.price_usd !== undefined) {
    if (input.price_usd === null) priceUSD = null;
    else if (typeof input.price_usd === "number" && Number.isFinite(input.price_usd)
             && input.price_usd >= 0) priceUSD = input.price_usd;
    else return "price_usd is neither null nor a non-negative number";
  }

  let summary: string | null | undefined;
  if (input.summary !== undefined) {
    summary = nonEmptyString(input.summary) ? input.summary : null;
  }

  // Unknown persona names are dropped rather than failing the row: the lobby
  // only ever uses personas to reorder, so a stray value is harmless.
  let personas: Persona[] | undefined;
  if (Array.isArray(input.personas)) {
    personas = input.personas.filter(
      (p): p is Persona => typeof p === "string" && PERSONA_SET.has(p),
    );
  }

  const row: RawCourse = {
    slug: input.slug,
    title: input.title,
    level: input.level as Level,
    author,
    group: (input.group as string | null) ?? null,
    reading_minutes: input.reading_minutes,
    narrated: input.narrated,
  };
  if (priceUSD !== undefined) row.price_usd = priceUSD;
  if (summary !== undefined) row.summary = summary;
  if (personas !== undefined) row.personas = personas;
  return row;
}

/**
 * Validates a whole /catalog response. Malformed rows are dropped and logged;
 * a malformed envelope is a hard failure, because a catalog with no `beta` flag
 * cannot be rendered safely (prices would leak).
 */
export function validateCatalog(input: unknown): RawCatalog | null {
  if (!isObject(input)) {
    console.error("[academy-public] catalog response is not an object");
    return null;
  }
  if (!isObject(input.beta) || typeof input.beta.free !== "boolean") {
    console.error("[academy-public] catalog response has no usable beta.free flag");
    return null;
  }
  if (!Array.isArray(input.courses)) {
    console.error("[academy-public] catalog response has no courses array");
    return null;
  }

  const courses: RawCourse[] = [];
  for (const [i, raw] of input.courses.entries()) {
    const result = validateCourse(raw);
    if (typeof result === "string") {
      const slug = isObject(raw) && typeof raw.slug === "string" ? raw.slug : `index ${i}`;
      console.warn(`[academy-public] dropped course ${slug}: ${result}`);
      continue;
    }
    courses.push(result);
  }

  return {
    generated_at: nonEmptyString(input.generated_at)
      ? input.generated_at
      : new Date(0).toISOString(),
    beta: { free: input.beta.free },
    courses,
  };
}

/** null on any network, status or envelope failure — the caller falls back. */
export async function fetchCatalog(): Promise<RawCatalog | null> {
  const url = `${academyPublicBase()}/catalog`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: ACADEMY_REVALIDATE_SECONDS, tags: [ACADEMY_TAG] },
    });
    if (!res.ok) {
      console.warn(`[academy-public] GET ${url} returned ${res.status}`);
      return null;
    }
    return validateCatalog(await res.json());
  } catch (err) {
    console.warn(`[academy-public] GET ${url} failed: ${(err as Error).message}`);
    return null;
  }
}
