import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { courseListJsonLd, PROVIDER_NAME } from "@/lib/jsonld";
import { DEFAULT_SITE_URL, LOBBY_PATH, siteUrl } from "@/lib/site";
import { toLobbyCatalog, snapshotCatalog } from "@/lib/catalog";
import { applySort } from "@/lib/filters";
import LobbyShell from "@/components/LobbyShell";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

const BASE = "https://www.faraday-player.com";
const SITE = "https://faraday-academy.vercel.app";
const catalog = toLobbyCatalog(snapshotCatalog()!, "snapshot", BASE);

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it("defaults to the lobby's production origin", () => {
    expect(siteUrl()).toBe(DEFAULT_SITE_URL);
  });

  it("honours NEXT_PUBLIC_SITE_URL and trims a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.test/");
    expect(siteUrl()).toBe("https://example.test");
  });

  it("ignores an empty override", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "   ");
    expect(siteUrl()).toBe(DEFAULT_SITE_URL);
  });
});

describe("courseListJsonLd", () => {
  const ld = courseListJsonLd(catalog, SITE, LOBBY_PATH);

  it("parses as JSON once serialised into a script tag", () => {
    const parsed = JSON.parse(JSON.stringify(ld));
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("ItemList");
    expect(parsed.url).toBe(`${SITE}${LOBBY_PATH}`);
  });

  it("lists every course exactly once, in the order the page renders", () => {
    expect(ld.itemListElement).toHaveLength(catalog.courses.length);
    const names = ld.itemListElement.map((e) => e.item.name);
    expect(names).toEqual(applySort(catalog.courses, "recommended").map((c) => c.title));
    expect(ld.itemListElement.map((e) => e.position)).toEqual(
      ld.itemListElement.map((_, i) => i + 1),
    );
  });

  it("points every Course at the player, never at the lobby", () => {
    for (const entry of ld.itemListElement) {
      expect(entry.item["@type"]).toBe("Course");
      expect(entry.item.url).toMatch(/^https:\/\/www\.faraday-player\.com\/[^/?#]+$/);
      expect(entry.item.provider).toEqual({
        "@type": "Organization", name: PROVIDER_NAME, url: SITE,
      });
    }
  });

  it("marks courses free while beta is free, with no Offer and no price", () => {
    expect(catalog.beta.free).toBe(true);
    for (const entry of ld.itemListElement) {
      expect(entry.item.isAccessibleForFree).toBe(true);
      expect(entry.item).not.toHaveProperty("offers");
    }
    expect(JSON.stringify(ld)).not.toMatch(/\$|"price"/);
  });

  it("drops isAccessibleForFree once beta ends", () => {
    const after = courseListJsonLd({ ...catalog, beta: { free: false } }, SITE, LOBBY_PATH);
    for (const entry of after.itemListElement) {
      expect(entry.item).not.toHaveProperty("isAccessibleForFree");
    }
  });

  it("carries no course code and no domain or tower code", () => {
    const text = JSON.stringify(ld);
    expect(text).not.toMatch(/\bFA-[A-Z0-9-]+\b/);
    expect(text).not.toMatch(/\bD[0-9]{1,2}(\.[0-9]+)?\b/);
    expect(text).not.toMatch(/\bT-?[0-9]{3}\b/);
  });
});

describe("sitemap and robots", () => {
  it("lists the lobby and nothing else — course pages belong to the player", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(`${DEFAULT_SITE_URL}${LOBBY_PATH}`);
  });

  it("allows crawling and points at the sitemap", () => {
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(r.sitemap).toBe(`${DEFAULT_SITE_URL}/sitemap.xml`);
  });
});

describe("the lobby's static render", () => {
  // The regression this guards: useSearchParams on a prerendered route pushed
  // the whole grid client-side, so the HTML carried no course links at all.
  const html = renderToStaticMarkup(createElement(LobbyShell, { catalog }));

  it("renders every card and its player link on the server", () => {
    const hrefs = [...html.matchAll(/href="(https:\/\/www\.faraday-player\.com\/[^"]+)"/g)]
      .map((m) => m[1]);
    expect(hrefs).toHaveLength(catalog.courses.length);
    expect(new Set(hrefs).size).toBe(catalog.courses.length);
  });

  it("renders the grid itself, not a skeleton", () => {
    expect(html.match(/<article/g) ?? []).toHaveLength(catalog.courses.length);
    expect(html).not.toContain("skeleton");
  });

  it("renders in Recommended order, so the first card is a 101", () => {
    const firstTitle = applySort(catalog.courses, "recommended")[0].title;
    expect(html.indexOf(firstTitle)).toBeGreaterThan(-1);
  });
});
