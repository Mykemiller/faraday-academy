// Canonical reference data (spec §5, Appendix B). Single source of truth for the UI.
import type { Cluster, Persona, School, SortKey, DurationFilterValue } from "./types";

export const PERSONAS: Persona[] = [
  "Executive", "Engineer", "Investor", "Operator", "Policy", "Consultant",
];

export const CLUSTERS: Cluster[] = [
  "Physical Stack", "Commercial & Capital", "Market & Policy",
  "Operations & Resilience", "Cross-Stack",
];

// 23 Schools (IDF Domains) grouped by cluster — matches the live Airtable Schools table.
export const SCHOOLS: School[] = [
  { id: "D1", name: "Chips & Density", cluster: "Physical Stack" },
  { id: "D2", name: "Power Architecture", cluster: "Physical Stack" },
  { id: "D7", name: "Cooling & Water", cluster: "Physical Stack" },
  { id: "D10", name: "Construction", cluster: "Physical Stack" },
  { id: "D20", name: "Facility IT & OT", cluster: "Physical Stack" },
  { id: "D4", name: "M&A & Capital Markets", cluster: "Commercial & Capital" },
  { id: "D6", name: "New Entrants", cluster: "Commercial & Capital" },
  { id: "D15", name: "Sovereign AI & Geopolitics", cluster: "Commercial & Capital" },
  { id: "D19", name: "Tax, Incentives & Fiscal Policy", cluster: "Commercial & Capital" },
  { id: "D21", name: "Insurance & Risk Markets", cluster: "Commercial & Capital" },
  { id: "D3", name: "Grid & Regulatory", cluster: "Market & Policy" },
  { id: "D13", name: "Community Relations", cluster: "Market & Policy" },
  { id: "D14", name: "Real Estate & Site Selection", cluster: "Market & Policy" },
  { id: "D18", name: "Community Opposition & Regulatory Risk", cluster: "Market & Policy" },
  { id: "D22", name: "Industry Media & Analyst Coverage", cluster: "Market & Policy" },
  { id: "D8", name: "People & Signals", cluster: "Operations & Resilience" },
  { id: "D9", name: "Orchestration", cluster: "Operations & Resilience" },
  { id: "D17", name: "Workforce & Labor Markets", cluster: "Operations & Resilience" },
  { id: "D23", name: "Outage Intelligence & Emergency Response", cluster: "Operations & Resilience" },
  { id: "D5", name: "Hyperscaler Activity", cluster: "Cross-Stack" },
  { id: "D11", name: "Sustainability", cluster: "Cross-Stack" },
  { id: "D12", name: "Networking & Interconnect", cluster: "Cross-Stack" },
  { id: "D16", name: "Cyber & Physical Security", cluster: "Cross-Stack" },
];

export const SCHOOLS_BY_CLUSTER: Record<Cluster, School[]> = CLUSTERS.reduce(
  (acc, cluster) => {
    acc[cluster] = SCHOOLS.filter((s) => s.cluster === cluster);
    return acc;
  },
  {} as Record<Cluster, School[]>,
);

export const DURATION_BUCKETS: { key: DurationFilterValue; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "lt60", label: "Under 1 hour" },
  { key: "60to180", label: "1–3 hours" },
  { key: "gt180", label: "3+ hours" },
];

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "recent", label: "Recently Updated" },
  { key: "shortest", label: "Shortest first" },
  { key: "longest", label: "Longest first" },
  { key: "title", label: "Title A–Z" },
];

export const PRICE_OPTIONS: { key: "all" | "free" | "paid"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

export const DEFAULT_FILTERS = {
  persona: null,
  schools: [] as string[],
  price: "all" as const,
  duration: "any" as const,
  certOnly: false,
  q: "",
  sort: "recommended" as const,
};

export function formatPrice(priceUSD: number): string {
  return priceUSD === 0 ? "Free" : `$${priceUSD.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
