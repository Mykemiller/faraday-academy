import { describe, it, expect, vi, afterEach } from "vitest";
import { toLobbyCatalog, toLobbyCourse } from "@/lib/catalog";
import { validateCatalog, type RawCourse } from "@/lib/academy-public";
import fixture from "./fixtures/catalog.json";

const BASE = "https://www.faraday-player.com";
const raw = (slug: string): RawCourse => {
  const catalog = validateCatalog(structuredClone(fixture))!;
  const row = catalog.courses.find((c) => c.slug === slug);
  if (!row) throw new Error(`fixture has no ${slug}`);
  return row;
};

describe("toLobbyCourse", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps the Capstone row, including its cluster", () => {
    const c = toLobbyCourse(raw("from-megawatts-to-money-the-capstone"), true, BASE);
    expect(c.subject).toBe("Capstone");
    expect(c.cluster).toBe("Cross-Stack");
    expect(c.level).toBe("Capstone");
    expect(c.playerUrl).toBe(`${BASE}/from-megawatts-to-money-the-capstone`);
    expect(c.narrated).toBe(true);
    expect(c.readingMinutes).toBeGreaterThan(0);
  });

  it("maps a 101 row into its real cluster", () => {
    const c = toLobbyCourse(raw("data-center-power-foundations"), true, BASE);
    expect(c.subject).toBe("Power Architecture");
    expect(c.cluster).toBe("Physical Stack");
    expect(c.author).toEqual({ voice: "gil", name: "Gilbert Faraday" });
  });

  it("files an unknown subject under Cross-Stack and logs it once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const row = { ...raw("the-threat-surface"), group: "Orbital Mechanics" };
    expect(toLobbyCourse(row, true, BASE).cluster).toBe("Cross-Stack");
    expect(toLobbyCourse(row, true, BASE).cluster).toBe("Cross-Stack");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Orbital Mechanics"));
  });

  it("falls back to Cross-Stack for a null subject without logging", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = toLobbyCourse({ ...raw("the-threat-surface"), group: null }, true, BASE);
    expect(c.subject).toBeNull();
    expect(c.cluster).toBe("Cross-Stack");
    expect(warn).not.toHaveBeenCalled();
  });

  it("withholds the price while beta is free, even when the catalog sends one", () => {
    const row = { ...raw("data-center-power-foundations"), price_usd: 19 };
    expect(toLobbyCourse(row, true, BASE).priceUSD).toBeNull();
    expect(toLobbyCourse(row, false, BASE).priceUSD).toBe(19);
  });

  it("omits description and personas when the catalog does not carry them", () => {
    const c = toLobbyCourse(raw("the-threat-surface"), true, BASE);
    expect(c.description).toBeUndefined();
    expect(c.personas).toBeUndefined();
  });

  it("carries summary and personas through when present", () => {
    const row = {
      ...raw("the-threat-surface"),
      summary: "What an attacker actually reaches first.",
      personas: ["Operator", "Engineer"],
    } satisfies RawCourse;
    const c = toLobbyCourse(row, true, BASE);
    expect(c.description).toBe("What an attacker actually reaches first.");
    expect(c.personas).toEqual(["Operator", "Engineer"]);
  });

  it("percent-encodes a slug that needs it", () => {
    const row = { ...raw("the-threat-surface"), slug: "a b/c" };
    expect(toLobbyCourse(row, true, BASE).playerUrl).toBe(`${BASE}/a%20b%2Fc`);
  });
});

describe("toLobbyCatalog", () => {
  it("carries the envelope and the declared source", () => {
    const catalog = toLobbyCatalog(validateCatalog(structuredClone(fixture))!, "live", BASE);
    expect(catalog.source).toBe("live");
    expect(catalog.beta).toEqual({ free: true });
    expect(catalog.generatedAt).toBe(fixture.generated_at);
    expect(catalog.courses).toHaveLength(fixture.courses.length);
  });
});
