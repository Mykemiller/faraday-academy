// Data contract for the Faraday Academy lobby (spec §5.1).

export type Persona =
  | "Executive" | "Engineer" | "Investor" | "Operator" | "Policy" | "Consultant";

export type Level = "101" | "201" | "301" | "401" | "X" | "Capstone";

export type ProgramType =
  | "Primer" | "Course" | "Track" | "Masterclass"
  | "Certification" | "Know the Players" | "Case Study" | "Workshop";

export type Cluster =
  | "Physical Stack" | "Commercial & Capital"
  | "Market & Policy" | "Operations & Resilience" | "Cross-Stack";

export interface School {
  id: string; // "D2"
  name: string; // "Power Architecture"
  cluster: Cluster;
}

export interface Course {
  id: string; // stable course code, e.g. "FA-D2-201"
  title: string;
  slug: string;
  description: string; // ≤160 chars, card copy
  school: School;
  level: Level;
  programType: ProgramType;
  personas: Persona[]; // ≥1
  durationMinutes: number; // > 0
  priceUSD: number; // 0 = free; else 4.99 | 9.99 | 99
  isFree: boolean;
  isCertification: boolean;
  maturity: "Established" | "Developing" | "Candidate" | "Under Construction";
  themes: string[]; // ["T-001"…]
  rating: number | null; // 0–5, ONLY if real; else null
  ratingCount: number | null;
  thumbnailUrl: string | null;
  url: string | null; // CTA target; null → "Coming soon"
  status: "Published";
  updatedAt: string; // ISO-8601
}

export type SortKey = "recommended" | "recent" | "shortest" | "longest" | "title";

export type PriceFilterValue = "all" | "free" | "paid";
export type DurationFilterValue = "any" | "lt60" | "60to180" | "gt180";

export interface FilterState {
  persona: Persona | null;
  schools: string[]; // school ids
  price: PriceFilterValue;
  duration: DurationFilterValue;
  certOnly: boolean;
  q: string;
  sort: SortKey;
}

export interface Chip {
  key: string; // unique key for React + removal target
  label: string;
  kind: "persona" | "school" | "price" | "duration" | "cert" | "q";
  value?: string; // e.g. school id, for removal
}
