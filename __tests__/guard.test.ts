import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateCatalog, validateCourse } from "@/lib/academy-public";
import fixture from "./fixtures/catalog.json";

const good = () => structuredClone(fixture.courses[0]);

describe("validateCourse", () => {
  it("accepts a real catalog row and drops the opaque code", () => {
    const row = validateCourse(good());
    expect(typeof row).not.toBe("string");
    if (typeof row === "string") return;
    expect(row.slug).toBe("from-megawatts-to-money-the-capstone");
    expect(row.level).toBe("Capstone");
    expect(row.author).toEqual({ voice: "gil", name: "Gilbert Faraday" });
    expect(row).not.toHaveProperty("code");
  });

  it("accepts a null author and a null group", () => {
    const row = validateCourse({ ...good(), author: null, group: null });
    expect(typeof row).not.toBe("string");
    if (typeof row === "string") return;
    expect(row.author).toBeNull();
    expect(row.group).toBeNull();
  });

  it.each([
    ["slug missing", { slug: "" }],
    ["title missing", { title: "  " }],
    ["unknown level", { level: "501" }],
    ["reading_minutes zero", { reading_minutes: 0 }],
    ["reading_minutes not numeric", { reading_minutes: "28" }],
    ["narrated not boolean", { narrated: "yes" }],
    ["unknown author voice", { author: { voice: "other", name: "X" } }],
    ["author without a name", { author: { voice: "gil", name: "" } }],
    ["negative price", { price_usd: -1 }],
  ])("rejects %s with a reason", (_label, patch) => {
    expect(typeof validateCourse({ ...good(), ...patch })).toBe("string");
  });

  it("rejects a non-object row", () => {
    expect(typeof validateCourse(null)).toBe("string");
    expect(typeof validateCourse([])).toBe("string");
  });

  it("keeps only the six known persona names", () => {
    const row = validateCourse({
      ...good(),
      personas: ["Executive", "Wizard", "Operator"],
    });
    if (typeof row === "string") throw new Error(row);
    expect(row.personas).toEqual(["Executive", "Operator"]);
  });

  it("normalises an empty summary to null", () => {
    const row = validateCourse({ ...good(), summary: "   " });
    if (typeof row === "string") throw new Error(row);
    expect(row.summary).toBeNull();
  });
});

describe("validateCatalog", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("passes a real response through intact", () => {
    const catalog = validateCatalog(structuredClone(fixture));
    expect(catalog).not.toBeNull();
    expect(catalog!.beta.free).toBe(true);
    expect(catalog!.courses).toHaveLength(fixture.courses.length);
  });

  it("drops malformed rows, logs them, and keeps the good ones", () => {
    const catalog = validateCatalog({
      ...structuredClone(fixture),
      courses: [good(), { slug: "broken" }, structuredClone(fixture.courses[1])],
    });
    expect(catalog!.courses.map((c) => c.slug)).toEqual([
      "from-megawatts-to-money-the-capstone",
      fixture.courses[1].slug,
    ]);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("dropped course broken"),
    );
  });

  it("fails the whole envelope when beta.free is missing", () => {
    const rest: Record<string, unknown> = structuredClone(fixture);
    delete rest.beta;
    expect(validateCatalog(rest)).toBeNull();
  });

  it("fails the whole envelope when courses is not an array", () => {
    expect(validateCatalog({ ...structuredClone(fixture), courses: {} })).toBeNull();
  });

  it("substitutes the epoch for a missing generated_at rather than failing", () => {
    const rest: Record<string, unknown> = structuredClone(fixture);
    delete rest.generated_at;
    expect(validateCatalog(rest)!.generated_at).toBe(new Date(0).toISOString());
  });
});
