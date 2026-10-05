// schema.org ItemList of Course for the lobby.
//
// Each Course's `url` is the player page, not a lobby anchor: the player is
// where the course is actually read, and pointing a crawler at a lobby card
// would be a lie about where the content lives.
//
// `offers` is omitted entirely while beta is free. `isAccessibleForFree: true`
// says the thing that is true; a $0 Offer would imply a price list that does
// not exist yet.

import type { LobbyCatalog } from "./types";
import { applySort } from "./filters";

export const PROVIDER_NAME = "Faraday Academy";

export function courseListJsonLd(catalog: LobbyCatalog, site: string, path: string) {
  const provider = { "@type": "Organization", name: PROVIDER_NAME, url: site };
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: PROVIDER_NAME,
    url: `${site}${path}`,
    // Same order the page renders in, so `position` means what it says.
    itemListElement: applySort(catalog.courses, "recommended").map((course, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: course.title,
        url: course.playerUrl,
        provider,
        ...(catalog.beta.free ? { isAccessibleForFree: true } : {}),
        ...(course.description ? { description: course.description } : {}),
        ...(course.author
          ? { author: { "@type": "Person", name: course.author.name } }
          : {}),
      },
    })),
  };
}
