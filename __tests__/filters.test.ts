import { describe, it, expect } from "vitest";
import { applyFilters, applySort, activeChips, bucket, matchText, hasActiveFilters } from "@/lib/filters";
import type { Course, FilterState } from "@/lib/types";
import { DEFAULT_FILTERS, SCHOOLS } from "@/lib/constants";

function course(over: Partial<Course>): Course {
  return {
    id: "FA-X", title: "Untitled", slug: "untitled", description: "",
    school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" },
    level: "201", programType: "Course", personas: ["Engineer"],
    durationMinutes: 90, priceUSD: 9.99, isFree: false, isCertification: false,
    maturity: "Established", themes: [], rating: null, ratingCount: null,
    thumbnailUrl: null, url: null, status: "Published", updatedAt: "2026-06-01T00:00:00Z",
    ...over,
  };
}
const f = (over: Partial<FilterState> = {}): FilterState => ({ ...DEFAULT_FILTERS, ...over });
const schoolName = (id: string) => SCHOOLS.find((s) => s.id === id)?.name ?? id;

describe("bucket boundaries (spec §5.5/§7.2)", () => {
  it("59 → lt60, 60 → 60to180, 180 → 60to180, 181 → gt180", () => {
    expect(bucket(59)).toBe("lt60");
    expect(bucket(60)).toBe("60to180");
    expect(bucket(180)).toBe("60to180");
    expect(bucket(181)).toBe("gt180");
  });
});

describe("persona filter", () => {
  const c = course({ personas: ["Engineer", "Executive"] });
  it("kept for Engineer, dropped for Investor", () => {
    expect(applyFilters([c], f({ persona: "Engineer" }))).toHaveLength(1);
    expect(applyFilters([c], f({ persona: "Investor" }))).toHaveLength(0);
  });
});

describe("school OR-within-group", () => {
  const d2 = course({ id: "a", school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" } });
  const d7 = course({ id: "b", school: { id: "D7", name: "Cooling & Water", cluster: "Physical Stack" } });
  const d3 = course({ id: "c", school: { id: "D3", name: "Grid & Regulatory", cluster: "Market & Policy" } });
  it("selecting [D2,D7] returns only those; empty returns all", () => {
    expect(applyFilters([d2, d7, d3], f({ schools: ["D2", "D7"] })).map((c) => c.id)).toEqual(["a", "b"]);
    expect(applyFilters([d2, d7, d3], f({ schools: [] }))).toHaveLength(3);
  });
});

describe("price filter", () => {
  const free = course({ id: "free", priceUSD: 0, isFree: true });
  const paid = course({ id: "paid", priceUSD: 9.99, isFree: false });
  it("free returns only isFree, paid returns only !isFree", () => {
    expect(applyFilters([free, paid], f({ price: "free" })).map((c) => c.id)).toEqual(["free"]);
    expect(applyFilters([free, paid], f({ price: "paid" })).map((c) => c.id)).toEqual(["paid"]);
  });
});

describe("duration filter at boundaries", () => {
  const mk = (m: number) => course({ id: `d${m}`, durationMinutes: m });
  const all = [mk(59), mk(60), mk(180), mk(181)];
  it("lt60 → 59 only; 60to180 → 60 and 180; gt180 → 181", () => {
    expect(applyFilters(all, f({ duration: "lt60" })).map((c) => c.id)).toEqual(["d59"]);
    expect(applyFilters(all, f({ duration: "60to180" })).map((c) => c.id)).toEqual(["d60", "d180"]);
    expect(applyFilters(all, f({ duration: "gt180" })).map((c) => c.id)).toEqual(["d181"]);
  });
});

describe("certification toggle", () => {
  const cert = course({ id: "cert", isCertification: true });
  const reg = course({ id: "reg", isCertification: false });
  it("on → only isCertification", () => {
    expect(applyFilters([cert, reg], f({ certOnly: true })).map((c) => c.id)).toEqual(["cert"]);
  });
});

describe("search", () => {
  const c = course({ title: "800V DC Power", description: "bus bars", school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" } });
  it("case-insensitive across title, description, school; trims", () => {
    expect(matchText(c, "  POWER ")).toBe(true); // title + school
    expect(matchText(c, "bus bars")).toBe(true); // description
    expect(matchText(c, "architecture")).toBe(true); // school name
    expect(matchText(c, "cooling")).toBe(false);
    expect(matchText(c, "   ")).toBe(true); // empty after trim
  });
});

describe("combination AND-across-groups", () => {
  const pass = course({
    id: "pass", personas: ["Engineer"], school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" },
    priceUSD: 9.99, isFree: false, durationMinutes: 90, isCertification: false, title: "Grid power",
  });
  const failsOne = course({
    id: "failsOne", personas: ["Engineer"], school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" },
    priceUSD: 0, isFree: true, durationMinutes: 90, isCertification: false, title: "Grid power", // fails price=paid
  });
  const filter = f({ persona: "Engineer", schools: ["D2"], price: "paid", duration: "60to180", q: "grid" });
  it("keeps the row passing all; drops the row failing exactly one", () => {
    const out = applyFilters([pass, failsOne], filter);
    expect(out.map((c) => c.id)).toEqual(["pass"]);
  });
  it("empty result returns []", () => {
    expect(applyFilters([failsOne], filter)).toEqual([]);
  });
});

describe("sort", () => {
  const a = course({ id: "a", title: "Bravo", durationMinutes: 120, personas: ["Investor"], updatedAt: "2026-06-01T00:00:00Z" });
  const b = course({ id: "b", title: "Alpha", durationMinutes: 45, personas: ["Engineer"], updatedAt: "2026-06-10T00:00:00Z" });
  const c = course({ id: "c", title: "Charlie", durationMinutes: 240, personas: ["Engineer"], updatedAt: "2026-05-01T00:00:00Z" });
  it("recommended puts persona matches first, then recent", () => {
    const out = applySort([a, b, c], "recommended", "Engineer");
    expect(out.map((x) => x.id)).toEqual(["b", "c", "a"]); // engineer matches (b newer, c older) then a
  });
  it("recommended with no persona === recent", () => {
    expect(applySort([a, b, c], "recommended", null).map((x) => x.id))
      .toEqual(applySort([a, b, c], "recent", null).map((x) => x.id));
  });
  it("shortest / longest / title order", () => {
    expect(applySort([a, b, c], "shortest", null).map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(applySort([a, b, c], "longest", null).map((x) => x.id)).toEqual(["c", "a", "b"]);
    expect(applySort([a, b, c], "title", null).map((x) => x.id)).toEqual(["b", "a", "c"]);
  });
  it("does not mutate the input array", () => {
    const input = [a, b, c];
    applySort(input, "title", null);
    expect(input.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("activeChips + hasActiveFilters", () => {
  it("produces chips for each active dimension and resolves school names", () => {
    const chips = activeChips(
      f({ persona: "Engineer", schools: ["D2"], price: "free", duration: "lt60", certOnly: true, q: "power" }),
      schoolName,
    );
    const kinds = chips.map((c) => c.kind);
    expect(kinds).toEqual(["persona", "school", "price", "duration", "cert", "q"]);
    expect(chips.find((c) => c.kind === "school")?.label).toBe("Power Architecture");
  });
  it("hasActiveFilters false for defaults, true otherwise", () => {
    expect(hasActiveFilters(f())).toBe(false);
    expect(hasActiveFilters(f({ q: "x" }))).toBe(true);
  });
});
