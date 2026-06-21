// Data access layer (spec §6). Loads the entire published catalog once, server-side.
// Source resolution (ACADEMY_CATALOG_SOURCE, default auto):
//   "airtable" → live Faraday Academy base (read-only). Default when AIRTABLE_API_KEY is set.
//   "seed"     → seed/courses.json. Default otherwise; also the fallback if Airtable errors.
// Wrapped in unstable_cache so the build step + ISR window share one fetch (review #6).
import { unstable_cache } from "next/cache";
import type {
  Course, Cluster, Level, Persona, ProgramType,
} from "./types";
import seed from "@/seed/courses.json";

export const CATALOG_REVALIDATE_SECONDS = 3600;

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appzhpKGOI248bCDQ";
const AIRTABLE_COURSES_TABLE = process.env.AIRTABLE_COURSES_TABLE ?? "Courses";

function resolveSource(): "airtable" | "seed" {
  const explicit = process.env.ACADEMY_CATALOG_SOURCE;
  if (explicit === "airtable" || explicit === "seed") return explicit;
  return process.env.AIRTABLE_API_KEY ? "airtable" : "seed";
}

type AirtableRecord = { id: string; fields: Record<string, unknown> };

function toCourse(f: Record<string, unknown>): Course | null {
  const id = f["Course Code"] as string | undefined;
  const title = f["Title"] as string | undefined;
  if (!id || !title) return null;
  const priceUSD = Number(f["Price USD"] ?? 0);
  const programType = (f["Program Type"] as ProgramType) ?? "Course";
  return {
    id,
    title,
    slug: (f["Slug"] as string) ?? id.toLowerCase(),
    description: (f["Description"] as string) ?? "",
    school: {
      id: (f["School ID"] as string) ?? "",
      name: (f["School Name"] as string) ?? "",
      cluster: (f["Cluster"] as Cluster) ?? "Cross-Stack",
    },
    level: (f["Level"] as Level) ?? "101",
    programType,
    personas: ((f["Personas"] as Persona[]) ?? []).filter(Boolean),
    durationMinutes: Number(f["Duration Minutes"] ?? 0),
    priceUSD,
    isFree: priceUSD === 0, // denormalized invariant
    isCertification: programType === "Certification",
    maturity: (f["Maturity"] as Course["maturity"]) ?? "Developing",
    themes: ((f["Themes"] as string[]) ?? []).filter(Boolean),
    rating: typeof f["Rating"] === "number" ? (f["Rating"] as number) : null,
    ratingCount: typeof f["Rating Count"] === "number" ? (f["Rating Count"] as number) : null,
    thumbnailUrl: (f["Thumbnail URL"] as string) ?? null,
    url: (f["URL"] as string) ?? null,
    status: "Published",
    updatedAt: (f["Updated At"] as string) ?? new Date(0).toISOString(),
  };
}

async function fetchFromAirtable(): Promise<Course[]> {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_COURSES_TABLE)}`;
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      // ISR: revalidate on the page; this fetch is memoized by unstable_cache.
      next: { revalidate: CATALOG_REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...json.records);
    offset = json.offset;
  } while (offset);

  return records
    .map((r) => toCourse(r.fields))
    .filter((c): c is Course => c !== null && c.status === "Published");
}

let warnedFallback = false;

const loadCatalog = unstable_cache(
  async (): Promise<Course[]> => {
    if (resolveSource() === "airtable") {
      try {
        const courses = await fetchFromAirtable();
        if (courses.length > 0) return courses;
        throw new Error("Airtable returned 0 published courses");
      } catch (err) {
        if (!warnedFallback) {
          console.warn(
            `[catalog] Airtable source failed, falling back to seed: ${(err as Error).message}`,
          );
          warnedFallback = true;
        }
      }
    }
    return seed as Course[];
  },
  ["academy-catalog"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ["academy-catalog"] },
);

export async function getCatalog(): Promise<Course[]> {
  return loadCatalog();
}
