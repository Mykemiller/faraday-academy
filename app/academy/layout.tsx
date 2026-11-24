import { headers } from "next/headers";
import { connection } from "next/server";
import GatePage from "@/lib/faraday-gate/ui/GatePage.tsx";
import {
  ACADEMY_APP,
  ACADEMY_APP_NAME,
  ACADEMY_GATE_COPY,
  ACADEMY_GATE_PRIVACY_URL,
  ACADEMY_GATE_TERMS_URL,
  guardAcademy,
} from "@/lib/faradayGate";
import AcademyFrame from "@/components/AcademyFrame";

// FDY-418 (ADM-1.7b): the Faraday beta access gate guards every /academy view. In mode "open" (the
// seeded default) it passes straight through and the lobby renders exactly as before, inside the same
// FDY-450 masthead frame. If the probe cannot get an answer (Supabase env not set on this project yet,
// RPC unreachable) it also passes through unless FARADAY_GATE_ENFORCE=1 (lib/faradayGate.ts).
// connection() keeps the gate a per-request decision: without it a build with no Supabase env would
// prerender the pass-through and freeze it. The catalog fetch keeps its own 300 s data cache and the
// "academy" tag, so /api/revalidate still purges it.
//
// When the gate closes, GatePage renders alone: it wears the same shared masthead (faraday-gate 1.1.0
// renders it from the vendored lib/faraday-masthead).
export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const gate = await guardAcademy({ cookieHeader: (await headers()).get("cookie") });
  if (!gate.pass) {
    return (
      <GatePage
        app={ACADEMY_APP}
        appName={ACADEMY_APP_NAME}
        copy={ACADEMY_GATE_COPY}
        view={gate.view}
        email={gate.email}
        termsUrl={ACADEMY_GATE_TERMS_URL}
        privacyUrl={ACADEMY_GATE_PRIVACY_URL}
      />
    );
  }
  return <AcademyFrame email={gate.email}>{children}</AcademyFrame>;
}
