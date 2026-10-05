import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fixture from "./fixtures/catalog.json";

const EMPTY_SNAPSHOT = {
  generated_at: "2026-01-01T00:00:00.000Z",
  beta: { free: true },
  courses: [],
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("getCatalog source order", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.doUnmock("@/seed/academy-catalog.snapshot.json");
  });

  it("serves the live catalog when the edge function answers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(structuredClone(fixture))));
    const { getCatalog } = await import("@/lib/catalog");
    const catalog = await getCatalog();
    expect(catalog.source).toBe("live");
    expect(catalog.courses).toHaveLength(fixture.courses.length);
  });

  it("falls back to the snapshot when the edge function errors, and warns", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "boom" }, 500)));
    const { getCatalog } = await import("@/lib/catalog");
    const catalog = await getCatalog();
    expect(catalog.source).toBe("snapshot");
    expect(catalog.courses.length).toBeGreaterThan(0);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("serving the committed snapshot"),
    );
  });

  it("falls back to the snapshot when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ENOTFOUND");
    }));
    const { getCatalog } = await import("@/lib/catalog");
    expect((await getCatalog()).source).toBe("snapshot");
  });

  it("falls back to the snapshot when the live envelope is unusable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ courses: [] })));
    const { getCatalog } = await import("@/lib/catalog");
    expect((await getCatalog()).source).toBe("snapshot");
  });

  it("falls back to the snapshot when the live catalog is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      jsonResponse({ ...structuredClone(fixture), courses: [] }),
    ));
    const { getCatalog } = await import("@/lib/catalog");
    expect((await getCatalog()).source).toBe("snapshot");
  });

  it("renders the offline state when neither source has rows", async () => {
    vi.doMock("@/seed/academy-catalog.snapshot.json", () => ({ default: EMPTY_SNAPSHOT }));
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "boom" }, 500)));
    const { getCatalog } = await import("@/lib/catalog");
    const catalog = await getCatalog();
    expect(catalog.courses).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("offline state"));
  });

  it("reads the catalog from ACADEMY_PUBLIC_BASE with the academy cache tag", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(structuredClone(fixture)));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("ACADEMY_PUBLIC_BASE", "https://example.test/functions/v1/academy-public");
    const { getCatalog } = await import("@/lib/catalog");
    await getCatalog();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/functions/v1/academy-public/catalog",
      expect.objectContaining({
        next: expect.objectContaining({ revalidate: 300, tags: ["academy"] }),
      }),
    );
    vi.unstubAllEnvs();
  });
});

describe("the committed snapshot", () => {
  it("re-validates clean, so a stale file cannot break the build", async () => {
    const { snapshotCatalog } = await import("@/lib/catalog");
    const snapshot = snapshotCatalog();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.courses.length).toBeGreaterThan(0);
    expect(new Set(snapshot!.courses.map((c) => c.slug)).size).toBe(snapshot!.courses.length);
  });

  it("carries no legacy catalog artefacts", async () => {
    const { snapshotCatalog } = await import("@/lib/catalog");
    const text = JSON.stringify(snapshotCatalog());
    expect(text).not.toMatch(/in-45-minutes/);
    expect(text).not.toMatch(/faraday-intelligence\.ai\/academy\/c\//);
    expect(text).not.toMatch(/\bFA-D\d/);
  });
});
