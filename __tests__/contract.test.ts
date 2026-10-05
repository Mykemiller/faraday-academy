// Live contract check against the deployed academy-public function.
// Skipped unless LIVE=1, so the default suite stays hermetic:
//   LIVE=1 npm test
import { describe, it, expect } from "vitest";
import { DEFAULT_ACADEMY_PUBLIC_BASE, validateCatalog } from "@/lib/academy-public";
import { toLobbyCatalog } from "@/lib/catalog";

const live = process.env.LIVE === "1";
const base = (process.env.ACADEMY_PUBLIC_BASE ?? DEFAULT_ACADEMY_PUBLIC_BASE).replace(/\/+$/, "");

describe.skipIf(!live)("academy-public /catalog contract", () => {
  it("returns a catalog this lobby can render end to end", async () => {
    const res = await fetch(`${base}/catalog`, { headers: { Accept: "application/json" } });
    expect(res.status).toBe(200);

    const catalog = validateCatalog(await res.json());
    expect(catalog).not.toBeNull();
    expect(catalog!.courses.length).toBeGreaterThan(0);
    expect(typeof catalog!.beta.free).toBe("boolean");

    // Every row survives validation: nothing is being silently dropped in production.
    const mapped = toLobbyCatalog(catalog!, "live", "https://www.faraday-player.com");
    expect(mapped.courses).toHaveLength(catalog!.courses.length);
    for (const c of mapped.courses) {
      expect(c.playerUrl).toMatch(/^https:\/\/www\.faraday-player\.com\/[^/?#]+$/);
      expect(c.readingMinutes).toBeGreaterThan(0);
    }
  }, 30_000);

  it("agrees with the committed snapshot on the published slug set", async () => {
    const res = await fetch(`${base}/catalog`, { headers: { Accept: "application/json" } });
    const liveCatalog = validateCatalog(await res.json())!;
    const { snapshotCatalog } = await import("@/lib/catalog");
    const snapshot = snapshotCatalog()!;
    const liveSlugs = [...liveCatalog.courses.map((c) => c.slug)].sort();
    const snapSlugs = [...snapshot.courses.map((c) => c.slug)].sort();
    expect(snapSlugs).toEqual(liveSlugs);
  }, 30_000);
});
