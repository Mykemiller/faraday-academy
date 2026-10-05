import type { MetadataRoute } from "next";
import { LOBBY_PATH, siteUrl } from "@/lib/site";

// Only the lobby. Course pages live on the player and are listed in the
// player's own sitemap; claiming them here would compete with it.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl()}${LOBBY_PATH}`,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
