import { describe, it, expect } from "vitest";
import { activeChips, applyFilters, applySort, hasActiveFilters, matchText } from "@/lib/filters";
import { parseFilters, serializeFilters } from "@/lib/url";
import { facetsFor } from "@/lib/facets";
import { toLobbyCatalog } from "@/lib/catalog";
import { validateCatalog } from "@/lib/academy-public";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { FilterState, LobbyCourse } from "@/lib/types";
import fixture from "./fixtures/catalog.json";

const courses: LobbyCourse[] = toLobbyCatalog(
  validateCatalog(structuredClone(fixture))!,
  "live",
  "https://www.faraday-player.com",
).courses;

const f = (patch: Partial<FilterState> = {}): FilterState => ({ ...DEFAULT_FILTERS, ...patch });
const slugs = (list: LobbyCourse[]) => list.map((c) => c.slug).sort();

describe("applyFilters", () => {
  it("returns everything with no filters set", () => {
    expect(applyFilters(courses, f())).toHaveLength(courses.length);
  });

  it("ORs within Level and ANDs across groups", () => {
    expect(slugs(applyFilters(courses, f({ levels: ["101"] })))).toEqual([
      "data-center-power-foundations",
    ]);
    expect(applyFilters(courses, f({ levels: ["101", "Capstone"] }))).toHaveLength(2);
    expect(
      applyFilters(courses, f({ levels: ["101"], subjects: ["Capstone"] })),
    ).toHaveLength(0);
  });

  it("filters by subject name, not by any code", () => {
    expect(slugs(applyFilters(courses, f({ subjects: ["Power Architecture"] })))).toEqual([
      "data-center-power-foundations",
    ]);
  });

  it("filters by author voice", () => {
    expect(applyFilters(courses, f({ author: "mach" })).every((c) => c.author?.voice === "mach"))
      .toBe(true);
    expect(applyFilters(courses, f({ author: "gil" })).length).toBeGreaterThan(0);
  });

  it("narrated=true keeps only narrated courses; false is a no-op", () => {
    expect(applyFilters(courses, f({ narrated: true })).every((c) => c.narrated)).toBe(true);
    expect(applyFilters(courses, f({ narrated: false }))).toHaveLength(courses.length);
  });

  it("searches title and subject, case-insensitively", () => {
    expect(slugs(applyFilters(courses, f({ q: "threat" })))).toEqual(["the-threat-surface"]);
    expect(slugs(applyFilters(courses, f({ q: "power architecture" })))).toEqual([
      "data-center-power-foundations",
    ]);
    expect(applyFilters(courses, f({ q: "   " }))).toHaveLength(courses.length);
  });

  it("never filters on persona", () => {
    expect(applyFilters(courses, f({ persona: "Investor" }))).toHaveLength(courses.length);
  });
});

describe("applySort", () => {
  it("Recommended orders by level, then title", () => {
    expect(applySort(courses, "recommended").map((c) => c.level)).toEqual([
      "101", "X", "Capstone",
    ]);
  });

  it("Title A–Z is alphabetical", () => {
    const titles = applySort(courses, "title").map((c) => c.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it("Shortest and Longest are mirror images by reading time", () => {
    const shortest = applySort(courses, "shortest").map((c) => c.readingMinutes);
    const longest = applySort(courses, "longest").map((c) => c.readingMinutes);
    expect(shortest).toEqual([...shortest].sort((a, b) => a - b));
    expect(longest).toEqual([...longest].sort((a, b) => b - a));
  });

  it("a persona reorders without dropping anything", () => {
    const tagged = courses.map((c, i) =>
      i === courses.length - 1 ? { ...c, personas: ["Investor" as const] } : c,
    );
    const sorted = applySort(tagged, "recommended", "Investor");
    expect(sorted).toHaveLength(tagged.length);
    expect(sorted[0].personas).toEqual(["Investor"]);
  });

  it("does not mutate its input", () => {
    const before = courses.map((c) => c.slug);
    applySort(courses, "title");
    expect(courses.map((c) => c.slug)).toEqual(before);
  });
});

describe("chips", () => {
  it("names every active filter and nothing else", () => {
    const chips = activeChips(
      f({ levels: ["101"], subjects: ["Power Architecture"], author: "mach", narrated: true, q: "grid" }),
    );
    expect(chips.map((c) => c.kind)).toEqual([
      "level", "subject", "author", "narrated", "q",
    ]);
    expect(chips.find((c) => c.kind === "author")!.label).toBe("Mach Eigen");
  });

  it("hasActiveFilters tracks the default state", () => {
    expect(hasActiveFilters(f())).toBe(false);
    expect(hasActiveFilters(f({ narrated: true }))).toBe(true);
  });
});

describe("URL round-trip", () => {
  const subjects = facetsFor(courses).subjects;

  it("omits defaults entirely", () => {
    expect(serializeFilters(f()).toString()).toBe("");
  });

  it("round-trips a full filter state, including a subject containing a comma", () => {
    const state = f({
      levels: ["101", "301"],
      subjects: ["Tax, Incentives & Fiscal Policy"],
      author: "gil",
      narrated: true,
      q: "cooling",
      sort: "shortest",
      persona: "Operator",
    });
    const parsed = parseFilters(serializeFilters(state), [...subjects, "Tax, Incentives & Fiscal Policy"]);
    expect(parsed).toEqual(state);
  });

  it("ignores retired params in silence", () => {
    const parsed = parseFilters(
      new URLSearchParams("price=paid&duration=lt60&cert=1&schools=D2&persona=Engineer"),
      subjects,
    );
    expect(parsed).toEqual(f({ persona: "Engineer" }));
  });

  it("drops unknown levels, subjects, authors, sorts and personas", () => {
    const parsed = parseFilters(
      new URLSearchParams("level=501&level=101&subject=Nope&author=zed&sort=random&persona=Wizard"),
      subjects,
    );
    expect(parsed).toEqual(f({ levels: ["101"] }));
  });

  it("de-duplicates repeated values", () => {
    expect(parseFilters(new URLSearchParams("level=101&level=101"), subjects).levels)
      .toEqual(["101"]);
  });

  it("treats narrated as a flag, not a value", () => {
    expect(parseFilters(new URLSearchParams("narrated=1"), subjects).narrated).toBe(true);
    expect(parseFilters(new URLSearchParams("narrated=true"), subjects).narrated).toBe(false);
  });
});

describe("facets", () => {
  it("derives levels, subjects and authors from the catalog in hand", () => {
    const facets = facetsFor(courses);
    expect(facets.levels).toEqual(["101", "X", "Capstone"]);
    expect(facets.subjects).toEqual(
      expect.arrayContaining(["Power Architecture", "Capstone"]),
    );
    expect(facets.authors.map((a) => a.name).sort()).toEqual(["Gilbert Faraday", "Mach Eigen"]);
    expect(facets.anyNarrated).toBe(true);
    expect(facets.anyPersonas).toBe(false);
  });

  it("groups subjects under their cluster in cluster order", () => {
    const groups = facetsFor(courses).subjectsByCluster;
    expect(groups.map((g) => g.cluster)).toEqual(["Physical Stack", "Cross-Stack"]);
  });

  it("reports no facets for an empty catalog", () => {
    const facets = facetsFor([]);
    expect(facets.levels).toEqual([]);
    expect(facets.subjectsByCluster).toEqual([]);
    expect(facets.authors).toEqual([]);
    expect(facets.anyNarrated).toBe(false);
  });
});

describe("matchText", () => {
  it("does not search the opaque code, because the model does not carry it", () => {
    expect(matchText(courses[0], "FA-X-ALL-401")).toBe(false);
  });
});
