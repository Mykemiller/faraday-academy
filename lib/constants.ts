// Canonical reference data for the lobby.
//
// SUBJECT_CLUSTER is keyed by the plain subject names the live catalog publishes
// in `group`. It carries no domain, sub-domain or tower identifiers, and the
// subject list the UI renders is always derived from the catalog in hand — this
// map only answers "which cluster does this subject belong to?".

import type { AuthorVoice, Cluster, Level, Persona, SortKey } from "./types";

export const PERSONAS: Persona[] = [
  "Executive", "Engineer", "Investor", "Operator", "Policy", "Consultant",
];

export const CLUSTERS: Cluster[] = [
  "Physical Stack", "Commercial & Capital", "Market & Policy",
  "Operations & Resilience", "Cross-Stack",
];

export const LEVELS: Level[] = ["101", "201", "301", "401", "X", "Capstone"];

export const SUBJECT_CLUSTER: Record<string, Cluster> = {
  // Physical Stack
  "Chips & Density": "Physical Stack",
  "Power Architecture": "Physical Stack",
  "Cooling & Water Technology": "Physical Stack",
  "Construction": "Physical Stack",
  "Facility IT & Operational Technology": "Physical Stack",
  // Commercial & Capital
  "M&A & Capital Markets": "Commercial & Capital",
  "New Entrants": "Commercial & Capital",
  "Sovereign AI & Geopolitics": "Commercial & Capital",
  "Tax, Incentives & Fiscal Policy": "Commercial & Capital",
  "Insurance & Risk Markets": "Commercial & Capital",
  // Market & Policy
  "Grid & Regulatory": "Market & Policy",
  "Community Relations": "Market & Policy",
  "Real Estate & Site Selection": "Market & Policy",
  "Community Opposition & Regulatory Risk": "Market & Policy",
  "Industry Media & Analyst Coverage": "Market & Policy",
  // Operations & Resilience
  "People & Signals": "Operations & Resilience",
  "Orchestration Intelligence & Control Plane": "Operations & Resilience",
  "Workforce & Labor Markets": "Operations & Resilience",
  "Outage Intelligence & Emergency Response": "Operations & Resilience",
  // Cross-Stack
  "Hyperscaler Activity": "Cross-Stack",
  "Sustainability": "Cross-Stack",
  "Networking & Interconnect": "Cross-Stack",
  "Cyber & Physical Security and Resilience": "Cross-Stack",
  "Capstone": "Cross-Stack",
};

const UNMAPPED_SUBJECTS = new Set<string>();

/** Unknown subjects land in Cross-Stack and are logged once each. */
export function clusterForSubject(subject: string): Cluster {
  const known = SUBJECT_CLUSTER[subject];
  if (known) return known;
  if (!UNMAPPED_SUBJECTS.has(subject)) {
    UNMAPPED_SUBJECTS.add(subject);
    console.warn(`[catalog] subject "${subject}" is not in SUBJECT_CLUSTER; filed under Cross-Stack`);
  }
  return "Cross-Stack";
}

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "title", label: "Title A–Z" },
  { key: "shortest", label: "Shortest" },
  { key: "longest", label: "Longest" },
];

export const AUTHOR_VOICES: AuthorVoice[] = ["gil", "mach"];

export const DEFAULT_FILTERS = {
  levels: [] as Level[],
  subjects: [] as string[],
  author: null,
  narrated: false,
  q: "",
  sort: "recommended" as const,
  persona: null,
};

/** Level order for the Recommended sort: the onramp first, the capstone last. */
export const LEVEL_ORDER: Record<Level, number> = {
  "101": 0, "201": 1, "301": 2, "401": 3, "X": 4, "Capstone": 5,
};

export function formatReadingMinutes(minutes: number): string {
  return `${minutes} min read`;
}

/** Only ever called once beta.free is false. */
export function formatPrice(priceUSD: number): string {
  return Number.isInteger(priceUSD) ? `$${priceUSD}` : `$${priceUSD.toFixed(2)}`;
}

export const BETA_PRICE_LABEL = "Free during beta";
