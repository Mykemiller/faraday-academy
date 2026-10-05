// The lobby's own origin, for canonical URLs, OG tags, the sitemap and robots.
export const DEFAULT_SITE_URL = "https://faraday-academy.vercel.app";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export const LOBBY_PATH = "/academy";
