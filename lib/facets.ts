// The filter rail's options are always derived from the catalog in hand: a
// subject with nothing published does not appear, and no total is implied.
import type { Cluster, Level, LobbyCourse } from "./types";
import { CLUSTERS, LEVEL_ORDER } from "./constants";

export interface Facets {
  levels: Level[];
  subjectsByCluster: { cluster: Cluster; subjects: string[] }[];
  subjects: string[];
  authors: { voice: "gil" | "mach"; name: string }[];
  anyNarrated: boolean;
  anyPersonas: boolean;
}

export function facetsFor(courses: LobbyCourse[]): Facets {
  const levels = [...new Set(courses.map((c) => c.level))].sort(
    (a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b],
  );

  const byCluster = new Map<Cluster, Set<string>>();
  for (const c of courses) {
    if (c.subject === null) continue;
    if (!byCluster.has(c.cluster)) byCluster.set(c.cluster, new Set());
    byCluster.get(c.cluster)!.add(c.subject);
  }

  const subjectsByCluster = CLUSTERS.flatMap((cluster) => {
    const set = byCluster.get(cluster);
    if (!set || set.size === 0) return [];
    return [{ cluster, subjects: [...set].sort((a, b) => a.localeCompare(b)) }];
  });

  const authors = new Map<"gil" | "mach", string>();
  for (const c of courses) {
    if (c.author && !authors.has(c.author.voice)) authors.set(c.author.voice, c.author.name);
  }

  return {
    levels,
    subjectsByCluster,
    subjects: subjectsByCluster.flatMap((g) => g.subjects),
    authors: [...authors].map(([voice, name]) => ({ voice, name })),
    anyNarrated: courses.some((c) => c.narrated),
    anyPersonas: courses.some((c) => (c.personas?.length ?? 0) > 0),
  };
}
