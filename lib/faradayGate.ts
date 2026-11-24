// FDY-418 (ADM-1.7b) — the Faraday beta access gate, wired for Faraday Academy (code FA, access_key "academy").
//
// The gate itself is the vendored package in ./faraday-gate/ (byte-identical to
// Mykemiller/faraday-workbench/packages/faraday-gate; never edit it here — see its README and
// MANIFEST.sha256). Its masthead comes from the sibling vendored ./faraday-masthead/. This file is the
// app-side wrapper: config from env names, the enforce flag, and the one policy the package
// deliberately does not make for us. Same shape as the FDY-414 Predicts wiring.
//
// THE POLICY: if the probe cannot get an answer (RPC missing, env not set, timeout), every probe answers
// { allowed:false, reason:"error" } and the package would show "unavailable". That must not close the
// Academy. So an "error" answer PASSES THROUGH unless FARADAY_GATE_ENFORCE === "1", in which case it fails
// closed (the package's own behaviour). Only "error" is softened: a real denial (no_grant, expired,
// waitlist_mode, …) and "unknown_app" are always honoured.
//
// Pure apart from the injected guard: no next/* imports, so tests can load it directly.

import { guardRoute, type GuardResult } from "./faraday-gate/server/guard.ts";
import type { GateServerConfig } from "./faraday-gate/server/check.ts";
import type { GateCopy } from "./faraday-gate/core.ts";
import academyCopy from "./faraday-gate/gate-copy/academy.json";

/** estate_entitled access_key for Faraday Academy (app code FA). */
export const ACADEMY_APP = "academy";
export const ACADEMY_APP_NAME = "Faraday Academy";
export const ACADEMY_GATE_COPY = academyCopy as GateCopy;
/** The Academy has no /terms or /privacy of its own; the gate links the estate's (same as ThoughtForge). */
export const ACADEMY_GATE_TERMS_URL = "https://www.faraday-intelligence.ai/terms";
export const ACADEMY_GATE_PRIVACY_URL = "https://www.faraday-intelligence.ai/privacy";

type Env = Record<string, string | undefined>;

/**
 * Gate config from the Faraday estate's standard env names (the same names the Predicts, ThoughtForge and
 * player deployments use): SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server-only) for the check, and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable) for the gate's own email one-time code.
 * The faraday-academy Vercel project does not hold these yet (2026-11-24): until Myke adds them the probe
 * answers "error" and, with enforce off, the Academy renders exactly as before.
 */
export function gateConfig(env: Env = process.env): GateServerConfig {
  return {
    supabaseUrl: env.SUPABASE_URL ?? "",
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  };
}

/** FARADAY_GATE_ENFORCE === "1" turns a probe error into a closed gate. Anything else: pass through. */
export function gateEnforced(env: Env = process.env): boolean {
  return env.FARADAY_GATE_ENFORCE === "1";
}

export interface AcademyGuardResult extends GuardResult {
  /** True when the gate could not get an answer and let the visitor through (enforce off). */
  failOpen: boolean;
}

/** Apply the enforce policy to a package GuardResult. */
export function applyEnforcePolicy(g: GuardResult, enforce: boolean): AcademyGuardResult {
  if (!g.pass && g.entitlement.reason === "error" && !enforce) {
    return { ...g, pass: true, view: "pass", failOpen: true };
  }
  return { ...g, failOpen: false };
}

export interface GuardDeps {
  cfg?: GateServerConfig;
  enforce?: boolean;
  guard?: typeof guardRoute;
}

/**
 * Guard the /academy route group. `cookieHeader` is the raw Cookie header (the gate reads its own
 * httpOnly fgate_at cookie from it). `appEmail` stays null: the Academy lobby has no sign-in of its own
 * (the signed-in state lives in the course player on another host), so the server never sees a verified
 * email and identity is the gate's own one-time code.
 * Never throws: an unexpected exception is treated as a probe error and the same policy applies.
 */
export async function guardAcademy(
  opts: { cookieHeader?: string | null; appEmail?: string | null },
  deps: GuardDeps = {},
): Promise<AcademyGuardResult> {
  const cfg = deps.cfg ?? gateConfig();
  const enforce = deps.enforce ?? gateEnforced();
  const guard = deps.guard ?? guardRoute;
  let g: GuardResult;
  try {
    g = await guard({ app: ACADEMY_APP, appEmail: opts.appEmail ?? null, cookieHeader: opts.cookieHeader ?? null }, cfg);
  } catch {
    g = {
      pass: false,
      view: "unavailable",
      email: null,
      identitySource: "none",
      entitlement: { allowed: false, reason: "error", mode: null, role: null, grant_kind: null, expires_at: null },
    };
  }
  return applyEnforcePolicy(g, enforce);
}
