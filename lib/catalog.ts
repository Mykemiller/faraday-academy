// The lobby's single data access point.
//
// Source order: live edge function → committed snapshot (warn) → empty, which
// the grid renders as the offline state. There is no Airtable path and no
// legacy seed: the published catalog has exactly one authority.

import type { LobbyCatalog, LobbyCourse, Persona } from "./types";
import { clusterForSubject } from "./constants";
import { playerBaseUrl, playerUrlForSlug } from "./player";
import {
  ACADEMY_REVALIDATE_SECONDS,
  ACADEMY_TAG,
  fetchCatalog,
  validateCatalog,
  type RawCatalog,
  type RawCourse,
} from "./academy-public";
import snapshotJson from "@/seed/academy-catalog.snapshot.json";

export { ACADEMY_REVALIDATE_SECONDS, ACADEMY_TAG };

/**
 * Wire row → card. Prices are withheld entirely while beta.free is true, so a
 * price can never leak through a rendering path that forgot to check the flag.
 */
export function toLobbyCourse(
  raw: RawCourse,
  betaFree: boolean,
  base: string = playerBaseUrl(),
): LobbyCourse {
  const subject = raw.group ?? null;
  const course: LobbyCourse = {
    slug: raw.slug,
    title: raw.title,
    level: raw.level,
    author: raw.author,
    subject,
    cluster: subject === null ? "Cross-Stack" : clusterForSubject(subject),
    readingMinutes: raw.reading_minutes,
    narrated: raw.narrated,
    playerUrl: playerUrlForSlug(raw.slug, base),
    priceUSD: betaFree ? null : (raw.price_usd ?? null),
  };
  if (raw.summary) course.description = raw.summary;
  if (raw.personas && raw.personas.length > 0) {
    course.personas = raw.personas as Persona[];
  }
  return course;
}

export function toLobbyCatalog(
  raw: RawCatalog,
  source: "live" | "snapshot",
  base: string = playerBaseUrl(),
): LobbyCatalog {
  return {
    courses: raw.courses.map((c) => toLobbyCourse(c, raw.beta.free, base)),
    beta: { free: raw.beta.free },
    generatedAt: raw.generated_at,
    source,
  };
}

let warnedSnapshot = false;

/** The committed snapshot, re-validated so a stale file cannot break the build. */
export function snapshotCatalog(): RawCatalog | null {
  return validateCatalog(snapshotJson);
}

export async function getCatalog(): Promise<LobbyCatalog> {
  const base = playerBaseUrl();

  const live = await fetchCatalog();
  if (live && live.courses.length > 0) return toLobbyCatalog(live, "live", base);

  const snapshot = snapshotCatalog();
  if (snapshot && snapshot.courses.length > 0) {
    if (!warnedSnapshot) {
      warnedSnapshot = true;
      console.warn(
        "[catalog] live catalog unavailable or empty; serving the committed snapshot",
      );
    }
    return toLobbyCatalog(snapshot, "snapshot", base);
  }

  console.error("[catalog] no live catalog and no usable snapshot; rendering the offline state");
  return {
    courses: [],
    beta: { free: snapshot?.beta.free ?? true },
    generatedAt: new Date(0).toISOString(),
    source: "snapshot",
  };
}

/** Distinct subjects present in the catalog, in cluster order then alphabetical. */
export function subjectsInCatalog(courses: LobbyCourse[]): string[] {
  const seen = new Map<string, LobbyCourse["cluster"]>();
  for (const c of courses) {
    if (c.subject !== null && !seen.has(c.subject)) seen.set(c.subject, c.cluster);
  }
  return [...seen.keys()].sort((a, b) => a.localeCompare(b));
}
