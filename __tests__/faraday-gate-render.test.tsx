// FDY-418 (ADM-1.7b) — renders the vendored GatePage under this app's React in every view and greps the
// HTML for a price or "$"; then renders the gated /academy layout with next/headers mocked to show that
// mode "open" (and a probe error with enforce off) is the FDY-450 frame unchanged, and a closed gate is
// GatePage alone.
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import GatePage from "@/lib/faraday-gate/ui/GatePage.tsx";
import { MASTHEAD_VERSION } from "@/lib/faraday-masthead/core.ts";
import type { GateView } from "@/lib/faraday-gate/core.ts";
import { ACADEMY_GATE_COPY } from "@/lib/faradayGate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const gate = vi.hoisted(() => ({ result: null as unknown }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "fgate_at=tok" }) }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/lib/faradayGate", async (orig) => {
  const real = await orig<typeof import("@/lib/faradayGate")>();
  return { ...real, guardAcademy: vi.fn(async () => gate.result) };
});

const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<link[^>]*>/g, "");

describe("GatePage render (no $ anywhere)", () => {
  it("renders every view with no price, the commercial line and the shared masthead", () => {
    const views: GateView[] = ["request", "expired", "waitlist", "unavailable"];
    for (const view of views) {
      for (const email of [null, "someone@example.com"]) {
        const html = renderToStaticMarkup(
          <GatePage app="academy" appName="Faraday Academy" version="1.0" copy={ACADEMY_GATE_COPY} view={view} email={email} />,
        );
        const visible = visibleText(html);
        expect(visible.includes("$"), `$ in ${view}`).toBe(false);
        expect(/USD|€|£|per month|\/mo\b|tokens?\b/i.test(visible), `price-like text in ${view}`).toBe(false);
        expect(visible).toContain("monthly subscription");
        if (view === "expired") expect(visible).toContain("Ask for more time");
        if (view === "waitlist") expect(visible).not.toContain("Request demo access");
        if (view !== "unavailable" && view !== "waitlist") expect(visible).toContain("Join the waitlist");
        if (email) expect(visible).toContain(email); else expect(visible).toContain("Sign in");
        expect(html).toContain(`<header class="fm" role="banner" data-fm="${MASTHEAD_VERSION}">`);
        expect(html).toContain(`<span class="fm-app">Faraday Academy</span>`);
      }
    }
  });

  it("the Academy copy renders its story only when approved", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/faraday-gate/gate-copy/academy.json"), "utf8"));
    const html = renderToStaticMarkup(<GatePage app="academy" appName="Faraday Academy" copy={raw} view="request" />).replace(/&#x27;/g, "'");
    if (raw.status === "approved") expect(html).toContain(raw.story);
    else expect(html).not.toContain(raw.story);
  });
});

describe("gated /academy layout", () => {
  beforeEach(() => { gate.result = null; });
  const child = <main id="main">lobby-sentinel</main>;
  const frameHtml = async () => {
    const { default: AcademyFrame } = await import("@/components/AcademyFrame");
    return renderToStaticMarkup(<AcademyFrame>{child}</AcademyFrame>);
  };
  const layoutHtml = async () => {
    const { default: AcademyLayout } = await import("@/app/academy/layout");
    return renderToStaticMarkup(await AcademyLayout({ children: child }));
  };
  const ent = { allowed: true, reason: "open", mode: "open", role: null, grant_kind: null, expires_at: null };

  it("mode open: byte-identical to the pre-gate frame (zero visible change)", async () => {
    gate.result = { pass: true, failOpen: false, view: "pass", email: null, identitySource: "none", entitlement: ent };
    const html = await layoutHtml();
    expect(html).toBe(await frameHtml());
    expect(html).toContain("lobby-sentinel");
  });

  it("probe error with enforce off (fail-open): same frame", async () => {
    gate.result = { pass: true, failOpen: true, view: "pass", email: null, identitySource: "none", entitlement: { ...ent, allowed: false, reason: "error", mode: null } };
    expect(await layoutHtml()).toBe(await frameHtml());
  });

  it("closed gate: GatePage alone, lobby not rendered, no $", async () => {
    gate.result = { pass: false, failOpen: false, view: "request", email: null, identitySource: "none", entitlement: { ...ent, allowed: false, reason: "no_grant", mode: "invite" } };
    const html = await layoutHtml();
    expect(html).not.toContain("lobby-sentinel");
    expect(html).toContain("Request demo access");
    expect(html).toContain("https://www.faraday-intelligence.ai/terms");
    expect(visibleText(html).includes("$")).toBe(false);
  });
});
