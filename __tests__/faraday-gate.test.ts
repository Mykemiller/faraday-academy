// @vitest-environment node
// FDY-418 (ADM-1.7b) — the Faraday Academy wiring of the Faraday beta access gate.
// Wrapper logic (config, enforce flag, error policy), end to end through the vendored guard with an
// injected fetch (no network), the gate-copy guards, and the vendored copy's byte identity.
import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACADEMY_APP, ACADEMY_GATE_COPY, applyEnforcePolicy, gateConfig, gateEnforced, guardAcademy,
} from "@/lib/faradayGate";
import { clearGateCache, type GateServerConfig } from "@/lib/faraday-gate/server/check.ts";
import { containsCountClaim, containsPrice, type Entitlement } from "@/lib/faraday-gate/core.ts";
import type { GuardResult } from "@/lib/faraday-gate/server/guard.ts";
import { handleGateAction } from "@/lib/faraday-gate/server/handlers.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VENDOR = path.join(ROOT, "lib", "faraday-gate");
const URL_ = "https://ycadmmngkdhvpcsrcuaq.supabase.co";

function fakeFetch(handler: (url: string, body: Record<string, unknown> | null) => unknown) {
  const calls: { url: string; body: Record<string, unknown> | null }[] = [];
  const f = (async (url: string, init: RequestInit = {}) => {
    const body = init.body ? JSON.parse(String(init.body)) : null;
    calls.push({ url, body });
    const out = handler(url, body);
    if (out instanceof Response) return out;
    return new Response(JSON.stringify(out), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return { f, calls };
}
const cfg = (f: typeof fetch): GateServerConfig => ({ supabaseUrl: URL_, serviceKey: "svc", anonKey: "anon", fetchImpl: f });
const missingRpc = () => new Response(JSON.stringify({ code: "PGRST202", message: "Could not find the function" }), { status: 404 });
const ent = (e: Partial<Entitlement>): Entitlement => ({ allowed: false, reason: "error", mode: null, role: null, grant_kind: null, expires_at: null, ...e });
const res = (e: Entitlement, view: GuardResult["view"], pass = false): GuardResult => ({ pass, entitlement: e, view, email: null, identitySource: "none" });

beforeEach(() => clearGateCache());

describe("config and enforce flag", () => {
  it("gateConfig reads the estate's standard env names", () => {
    expect(gateConfig({ SUPABASE_URL: URL_, SUPABASE_SERVICE_ROLE_KEY: "svc", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" }))
      .toEqual({ supabaseUrl: URL_, serviceKey: "svc", anonKey: "anon" });
    expect(gateConfig({})).toEqual({ supabaseUrl: "", serviceKey: "", anonKey: undefined });
  });

  it("FARADAY_GATE_ENFORCE is on only for the exact string \"1\"", () => {
    expect(gateEnforced({ FARADAY_GATE_ENFORCE: "1" })).toBe(true);
    for (const v of [undefined, "", "0", "true", "yes", " 1"]) expect(gateEnforced({ FARADAY_GATE_ENFORCE: v })).toBe(false);
  });
});

describe("enforce policy", () => {
  it("probe error passes through when enforce is off, closes when on", () => {
    const g = res(ent({ reason: "error" }), "unavailable");
    expect(applyEnforcePolicy(g, false)).toMatchObject({ pass: true, view: "pass", failOpen: true });
    expect(applyEnforcePolicy(g, true)).toMatchObject({ pass: false, view: "unavailable", failOpen: false });
  });

  it("real denials are never softened, enforce or not", () => {
    for (const [reason, view] of [["no_grant", "request"], ["expired", "expired"], ["waitlist_mode", "waitlist"], ["unknown_app", "unavailable"], ["revoked", "request"]] as const) {
      for (const enforce of [false, true]) {
        expect(applyEnforcePolicy(res(ent({ reason, mode: "invite" }), view), enforce)).toMatchObject({ pass: false, failOpen: false });
      }
    }
  });

  it("a pass stays a pass and is not flagged fail-open", () => {
    expect(applyEnforcePolicy(res(ent({ allowed: true, reason: "open", mode: "open" }), "pass", true), true))
      .toMatchObject({ pass: true, failOpen: false });
  });
});

describe("guardAcademy through the vendored guard (injected fetch)", () => {
  it("open mode: one probe for app 'academy', no identity lookup, pass", async () => {
    const { f, calls } = fakeFetch(() => ({ allowed: true, reason: "open", mode: "open" }));
    const g = await guardAcademy({ cookieHeader: "fgate_at=tok" }, { cfg: cfg(f), enforce: true });
    expect(g).toMatchObject({ pass: true, failOpen: false, email: null });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rest\/v1\/rpc\/estate_entitled$/);
    expect(calls[0].body).toEqual({ p_email: null, p_app: ACADEMY_APP });
  });

  it("RPC missing → pass through by default, closed with FARADAY_GATE_ENFORCE=1", async () => {
    const { f } = fakeFetch(missingRpc);
    expect(await guardAcademy({}, { cfg: cfg(f), enforce: false })).toMatchObject({ pass: true, failOpen: true });
    clearGateCache();
    expect(await guardAcademy({}, { cfg: cfg(f), enforce: true })).toMatchObject({ pass: false, view: "unavailable" });
  });

  it("no Supabase env at all (today's faraday-academy project) → pass through unless enforced", async () => {
    const empty: GateServerConfig = { supabaseUrl: "", serviceKey: "" };
    expect((await guardAcademy({}, { cfg: empty, enforce: false })).pass).toBe(true);
    expect((await guardAcademy({}, { cfg: empty, enforce: true })).pass).toBe(false);
  });

  it("invite mode, signed out → request view (gate shown)", async () => {
    const { f } = fakeFetch(() => ({ allowed: false, reason: "no_grant", mode: "invite" }));
    expect(await guardAcademy({ cookieHeader: null }, { cfg: cfg(f), enforce: false })).toMatchObject({ pass: false, view: "request" });
  });

  it("invite mode, gate cookie with a grant → pass, identity from the gate", async () => {
    const { f } = fakeFetch((url, body) => {
      if (url.endsWith("/auth/v1/user")) return { email: "Reader@Example.com" };
      return body?.p_email ? { allowed: true, reason: "grant", mode: "invite", grant_kind: "demo" } : { allowed: false, reason: "no_grant", mode: "invite" };
    });
    const g = await guardAcademy({ cookieHeader: "other=1; fgate_at=tok" }, { cfg: cfg(f), enforce: true });
    expect(g).toMatchObject({ pass: true, email: "reader@example.com", identitySource: "gate" });
  });

  it("a guard that throws is treated as a probe error (never a crash)", async () => {
    const boom = (async () => { throw new Error("boom"); }) as never;
    expect((await guardAcademy({}, { cfg: gateConfig({}), enforce: false, guard: boom })).pass).toBe(true);
    expect(await guardAcademy({}, { cfg: gateConfig({}), enforce: true, guard: boom })).toMatchObject({ pass: false, view: "unavailable" });
  });
});

describe("gate API handler as wired", () => {
  it("refuses GET, cross-origin POST and unknown actions; sends no email without config", async () => {
    const empty: GateServerConfig = { supabaseUrl: "", serviceKey: "" };
    expect((await handleGateAction(new Request("https://a.test/api/faraday-gate/code"), "code", ACADEMY_APP, empty)).status).toBe(405);
    const xorigin = new Request("https://a.test/api/faraday-gate/code", { method: "POST", headers: { origin: "https://evil.test", host: "a.test" }, body: "{}" });
    expect((await handleGateAction(xorigin, "code", ACADEMY_APP, empty)).status).toBe(403);
    const unknown = new Request("https://a.test/api/faraday-gate/nope", { method: "POST", headers: { host: "a.test" }, body: "{}" });
    expect((await handleGateAction(unknown, "nope", ACADEMY_APP, empty)).status).toBe(404);
    const code = new Request("https://a.test/api/faraday-gate/code", { method: "POST", headers: { host: "a.test" }, body: JSON.stringify({ email: "a@b.co" }) });
    expect((await handleGateAction(code, "code", ACADEMY_APP, empty)).status).toBe(400);
  });
});

describe("Academy gate copy", () => {
  it("right key, no price, no counts", () => {
    expect(ACADEMY_GATE_COPY.access_key).toBe("academy");
    const all = [ACADEMY_GATE_COPY.story, ...ACADEMY_GATE_COPY.what_you_get].join("\n");
    expect(containsPrice(all)).toBe(false);
    expect(containsCountClaim(all)).toBe(false);
    expect(["draft", "approved"]).toContain(ACADEMY_GATE_COPY.status);
  });
});

// ── vendored copy is byte-identical to its manifest (and to the canonical package when present) ─
function listFiles(dir: string, base = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? listFiles(p, base) : [path.relative(base, p).split(path.sep).join("/")];
  });
}
const sha = (p: string) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const manifest = fs.readFileSync(path.join(VENDOR, "MANIFEST.sha256"), "utf8").trim().split("\n").map((l) => {
  const m = l.match(/^([0-9a-f]{64}) {2}(.+)$/);
  if (!m) throw new Error(`bad manifest line: ${l}`);
  return { hash: m[1], file: m[2] };
});

describe("vendored faraday-gate identity", () => {
  it("matches MANIFEST.sha256 exactly (no edits, no extra or missing files)", () => {
    const onDisk = listFiles(VENDOR).filter((f) => f !== "MANIFEST.sha256").sort();
    expect(onDisk).toEqual(manifest.map((m) => m.file).sort());
    for (const m of manifest) expect(sha(path.join(VENDOR, m.file)), `${m.file} drifted from the manifest`).toBe(m.hash);
    for (const required of ["core.ts", "VERSION", "README.md", "server/check.ts", "server/guard.ts", "server/handlers.ts",
      "server/identity.ts", "server/request.ts", "ui/GatePage.tsx", "ui/gate.html", "gate-copy/academy.json"]) {
      expect(manifest.some((m) => m.file === required), `${required} missing from the vendored copy`).toBe(true);
    }
    expect(fs.readFileSync(path.join(VENDOR, "VERSION"), "utf8").trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("GatePage's masthead import resolves to the sibling vendored faraday-masthead", () => {
    const src = fs.readFileSync(path.join(VENDOR, "ui", "GatePage.tsx"), "utf8");
    expect(src).toContain('from "../../faraday-masthead/ui/Masthead.tsx"');
    expect(fs.existsSync(path.join(ROOT, "lib", "faraday-masthead", "ui", "Masthead.tsx"))).toBe(true);
  });

  const CANONICAL = process.env.FARADAY_GATE_CANONICAL || path.resolve(ROOT, "../faraday-workbench/packages/faraday-gate");
  it.skipIf(!fs.existsSync(path.join(CANONICAL, "core.ts")))("vendored files are byte-identical to the canonical package (set FARADAY_GATE_CANONICAL)", () => {
    expect(fs.readFileSync(path.join(VENDOR, "VERSION"), "utf8")).toBe(fs.readFileSync(path.join(CANONICAL, "VERSION"), "utf8"));
    for (const m of manifest) expect(sha(path.join(CANONICAL, m.file)), `${m.file} differs from canonical: re-vendor`).toBe(m.hash);
  });
});
