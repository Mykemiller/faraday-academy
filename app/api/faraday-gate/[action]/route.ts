// FDY-418 (ADM-1.7b) — the Faraday gate's server actions for Faraday Academy.
//   POST /api/faraday-gate/code     { email }                  email a one-time code
//   POST /api/faraday-gate/verify   { email, code }            verify it; sets the httpOnly fgate_at cookie
//   POST /api/faraday-gate/request  { email, kind, message? }  Request demo access / Join the waitlist
//   POST /api/faraday-gate/signout                             clears the cookie
// All logic is the vendored package (lib/faraday-gate/server/handlers.ts): same-origin only, POST only,
// 5 requests per IP per hour. The app is fixed to "academy" here. These routes are only reached from the
// gate page, which renders only when the gate is closed; in mode "open" nothing calls them.
import { handleGateAction } from "@/lib/faraday-gate/server/handlers.ts";
import { ACADEMY_APP, gateConfig } from "@/lib/faradayGate";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }): Promise<Response> {
  const { action } = await params;
  return handleGateAction(req, action, ACADEMY_APP, gateConfig());
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }): Promise<Response> {
  const { action } = await params;
  return handleGateAction(req, action, ACADEMY_APP, gateConfig()); // answers 405
}
