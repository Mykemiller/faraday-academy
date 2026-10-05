// Data contract for the Faraday Academy lobby.
//
// Every field here is sourced from the academy-public edge function's /catalog
// response. Nothing is invented: no ratings, no durations the catalog does not
// publish, no certification flags, no program taxonomy. The `code` the catalog
// carries is deliberately absent — it is opaque and never rendered.

export type Persona =
  | "Executive" | "Engineer" | "Investor" | "Operator" | "Policy" | "Consultant";

export type Level = "101" | "201" | "301" | "401" | "X" | "Capstone";

export type AuthorVoice = "gil" | "mach";

export interface Author {
  voice: AuthorVoice;
  name: string;
}

export type Cluster =
  | "Physical Stack" | "Commercial & Capital"
  | "Market & Policy" | "Operations & Resilience" | "Cross-Stack";

/**
 * One card in the lobby. `subject` is the catalog's plain `group` name; `cluster`
 * is derived from it for grouping and iconography only.
 */
export interface LobbyCourse {
  slug: string;
  title: string;
  level: Level;
  author: Author | null;
  /** The catalog's plain `group` name. null where the catalog publishes none. */
  subject: string | null;
  cluster: Cluster;
  readingMinutes: number;
  narrated: boolean;
  playerUrl: string;
  /** null while beta.free is true — no price is rendered during beta. */
  priceUSD: number | null;
  description?: string;
  personas?: Persona[];
}

export interface Beta {
  free: boolean;
}

export interface LobbyCatalog {
  courses: LobbyCourse[];
  beta: Beta;
  generatedAt: string;
  source: "live" | "snapshot";
}

export type SortKey = "recommended" | "title" | "shortest" | "longest";

export interface FilterState {
  levels: Level[];
  subjects: string[];
  author: AuthorVoice | null;
  narrated: boolean;
  q: string;
  sort: SortKey;
  /** Reorders the grid; never hides a course. */
  persona: Persona | null;
}

export interface Chip {
  key: string;
  label: string;
  kind: "level" | "subject" | "author" | "narrated" | "q" | "persona";
  value?: string;
}
