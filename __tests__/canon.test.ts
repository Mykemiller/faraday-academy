// Canon guard over the rendered lobby.
//
// These assertions run against the real catalog snapshot, not a hand-picked
// fixture, because the failure mode they protect against is a single new course
// dragging a code or a price into the page.
//
// Two text surfaces are distinguished on purpose:
//   • the full HTML, for codes, prices and URLs — nothing may carry those;
//   • the "chrome" (all course titles and subject names removed), for words a
//     real course may legitimately be *about*. The live catalog publishes
//     "International Markets & Site Certification"; a bare /certif/ match over
//     the whole page would fail on a correct lobby.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { toLobbyCatalog, snapshotCatalog } from "@/lib/catalog";
import CourseGrid from "@/components/CourseGrid";
import FilterControls from "@/components/FilterControls";
import Toolbar from "@/components/Toolbar";
import { facetsFor } from "@/lib/facets";
import { DEFAULT_FILTERS } from "@/lib/constants";
import { activeChips } from "@/lib/filters";

const BASE = "https://www.faraday-player.com";

const DOMAIN_CODE = /\bD[0-9]{1,2}(\.[0-9]+)?\b/;
const TOWER_CODE = /\bT-?[0-9]{3}\b/;
const COURSE_CODE = /\bFA-[A-Z0-9-]+\b/;
const DOLLARS = /\$\s?[0-9]/;
const COUNT_OF_THINGS = /\b\d+\s+(domains?|sub-?domains?|towers?|schools?|courses?)\b/i;

const BANNED = [
  "empowering", "leveraging", "unlocking potential", "cutting-edge",
  "best-in-class", "revolutionary", "in today's fast-paced world",
  "Great question!", "I hope that helps!", "We're excited to announce",
  "Faraday's methodology", "our approach", "the Faraday framework",
  "LearnWorlds",
];

const catalog = toLobbyCatalog(snapshotCatalog()!, "snapshot", BASE);
const facets = facetsFor(catalog.courses);

const noop = () => {};
const handlers = {
  setPersona: noop, toggleLevel: noop, toggleSubject: noop,
  setAuthor: noop, setNarrated: noop, clearAll: noop,
};

let html = "";
let chrome = "";

beforeAll(() => {
  html = [
    renderToStaticMarkup(
      createElement(FilterControls, {
        filters: DEFAULT_FILTERS, facets, handlers, includePersona: true,
      }),
    ),
    renderToStaticMarkup(
      createElement(Toolbar, {
        q: "", onQChange: noop, sort: "recommended" as const, onSortChange: noop,
        chips: activeChips(DEFAULT_FILTERS), onRemoveChip: noop, onClearAll: noop,
        onOpenDrawer: noop, drawerTriggerRef: { current: null },
      }),
    ),
    renderToStaticMarkup(
      createElement(CourseGrid, {
        results: catalog.courses, betaFree: catalog.beta.free,
      }),
    ),
  ].join("\n");

  // Strip the editorial surface: titles, subjects, author names and slugs.
  // Both raw and HTML-escaped forms, because React escapes "&" in a title like
  // "International Markets & Site Certification" and a raw-only strip misses it.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  const editorial = [
    ...catalog.courses.map((c) => c.title),
    ...catalog.courses.map((c) => c.slug),
    ...new Set(catalog.courses.flatMap((c) => (c.subject ? [c.subject] : []))),
    ...new Set(catalog.courses.flatMap((c) => (c.author ? [c.author.name] : []))),
  ].flatMap((s) => [s, escapeHtml(s)])
    .sort((a, b) => b.length - a.length);
  chrome = editorial.reduce((acc, s) => acc.split(s).join(" "), html);
});

describe("the rendered lobby", () => {
  it("has a real catalog to assert over", () => {
    expect(catalog.courses.length).toBeGreaterThan(50);
    expect(catalog.beta.free).toBe(true);
    expect(html.length).toBeGreaterThan(10_000);
  });

  it("renders no domain or sub-domain code", () => {
    expect(html.match(DOMAIN_CODE)?.[0] ?? null).toBeNull();
  });

  it("renders no tower code", () => {
    expect(html.match(TOWER_CODE)?.[0] ?? null).toBeNull();
  });

  it("renders no course code, even though the catalog sends one", () => {
    expect(html.match(COURSE_CODE)?.[0] ?? null).toBeNull();
  });

  it("renders no dollar amount while beta is free", () => {
    expect(html.match(DOLLARS)?.[0] ?? null).toBeNull();
  });

  it("says 'Free during beta' instead", () => {
    expect(html).toContain("Free during beta");
  });

  it("renders no certification UI", () => {
    // Course titles are stripped first — a course may be *about* certification.
    expect(chrome).not.toMatch(/certif/i);
  });

  it("never mentions LearnWorlds or a banned phrase", () => {
    for (const phrase of BANNED) {
      expect(chrome.toLowerCase()).not.toContain(phrase.toLowerCase());
    }
  });

  it("states no count of domains, schools, towers or courses", () => {
    expect(chrome.match(COUNT_OF_THINGS)?.[0] ?? null).toBeNull();
  });

  it("announces a change to screen readers without a number", () => {
    expect(html).toContain("Results updated.");
  });

  it("offers no price, duration or certification filter", () => {
    expect(chrome).not.toMatch(/\bprice\b/i);
    expect(chrome).not.toMatch(/\bduration\b/i);
    expect(chrome).not.toMatch(/\bschool\b/i);
    expect(chrome).not.toMatch(/\b(1–3 hours|under 1 hour|3\+ hours)\b/i);
  });

  it("offers Level, Subject, Author and Narration", () => {
    for (const label of ["Level", "Subject", "Author", "Narration"]) {
      expect(html).toContain(`>${label}<`);
    }
  });

  it("offers exactly the four sanctioned sorts", () => {
    for (const label of ["Recommended", "Title A–Z", "Shortest", "Longest"]) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain("Recently Updated");
  });

  it("links every card at the player and nowhere else", () => {
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(catalog.courses.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/www\.faraday-player\.com\/[^/?#]+$/);
    }
    expect(html).not.toContain("faraday-intelligence.ai");
  });

  it("renders no legacy catalog string", () => {
    for (const legacy of ["in 45 Minutes", "in-45-minutes", "Coming soon", "Learning Path", "Practitioner"]) {
      expect(html).not.toContain(legacy);
    }
  });
});

describe("the catalog behind it", () => {
  it("publishes a subject this build knows how to cluster", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    facetsFor(toLobbyCatalog(snapshotCatalog()!, "snapshot", BASE).courses);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("carries no price while beta is free", () => {
    expect(catalog.courses.every((c) => c.priceUSD === null)).toBe(true);
  });
});
