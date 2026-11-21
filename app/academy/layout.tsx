import { AppBar, Masthead } from "@/lib/faraday-masthead/ui/Masthead.tsx";
import { LOBBY_PATH } from "@/lib/site";
import { playerBaseUrl } from "@/lib/player";

// FDY-450 · CC-BRAND-MASTHEAD-1.0. The shared Faraday masthead (vendored, never edited:
// lib/faraday-masthead/) sits above every /academy view — the lobby and its error state —
// with the Academy's own navigation in the AppBar under it. Each page keeps its own
// <main id="main">, the skip link's target.
//
// The lobby has no sign-in of its own (every lesson is open to read). The "Sign in"
// control points at the course player, the only Academy surface with a signed-in state.
export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Masthead appName="Faraday Academy" homeHref={LOBBY_PATH} signInHref={playerBaseUrl()} />
      <AppBar
        label="Faraday Academy"
        links={[{ label: "Courses", href: LOBBY_PATH, current: true }]}
      />
      {children}
    </>
  );
}
