// The player is the only place a course is read. The lobby never renders a
// course body, so every card points at the player's canonical course URL.
//
// Canonical form on the player host is https://www.faraday-player.com/<slug>;
// /academy/<slug> 308s to it, so linking the prefixed form would cost every
// reader a redirect. No query strings, no course codes.

export const DEFAULT_PLAYER_BASE_URL = "https://www.faraday-player.com";

export function playerBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PLAYER_BASE_URL?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_PLAYER_BASE_URL).replace(/\/+$/, "");
}

export function playerUrlForSlug(slug: string, base: string = playerBaseUrl()): string {
  return `${base}/${encodeURIComponent(slug)}`;
}
