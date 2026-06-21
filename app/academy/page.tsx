import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import LobbyShell from "@/components/LobbyShell";
import { GridSkeleton } from "@/components/Skeletons";

// SSG + ISR (review #1): rendered statically, revalidated hourly (matches
// CATALOG_REVALIDATE_SECONDS). Must be a static literal for Next's segment config.
export const revalidate = 3600;

export default async function AcademyPage() {
  const catalog = await getCatalog();
  return (
    <Suspense fallback={<GridSkeleton />}>
      <LobbyShell catalog={catalog} />
    </Suspense>
  );
}
