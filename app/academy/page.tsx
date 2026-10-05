import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { courseListJsonLd } from "@/lib/jsonld";
import { LOBBY_PATH, siteUrl } from "@/lib/site";
import LobbyShell from "@/components/LobbyShell";

// Static with ISR. The edge function's own cache window is 300s too, and
// /api/revalidate purges the "academy" tag the moment a course changes status.
export const revalidate = 300;

const TITLE = "Faraday Academy";
const DESCRIPTION =
  "Short, sharp courses on the forces shaping the AI data center economy — power, " +
  "cooling, capital, grid policy, and sovereign compute. Every lesson is open to read.";

export function generateMetadata(): Metadata {
  const site = siteUrl();
  const url = `${site}${LOBBY_PATH}`;
  return {
    metadataBase: new URL(site),
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: LOBBY_PATH },
    openGraph: {
      type: "website",
      siteName: TITLE,
      title: TITLE,
      description: DESCRIPTION,
      url,
    },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

export default async function AcademyPage() {
  const catalog = await getCatalog();
  const jsonLd = courseListJsonLd(catalog, siteUrl(), LOBBY_PATH);

  return (
    <>
      <script
        type="application/ld+json"
        // The payload is built from validated catalog fields, never from raw input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LobbyShell catalog={catalog} />
    </>
  );
}
