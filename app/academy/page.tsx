import { Suspense } from "react";
import { getCatalog, ACADEMY_REVALIDATE_SECONDS } from "@/lib/catalog";
import LobbyShell from "@/components/LobbyShell";
import { GridSkeleton } from "@/components/Skeletons";

// Static with ISR; the edge function's own cache headers are 300s too.
export const revalidate = 300;

export default async function AcademyPage() {
  const catalog = await getCatalog();
  void ACADEMY_REVALIDATE_SECONDS;
  return (
    <Suspense fallback={<GridSkeleton />}>
      <LobbyShell catalog={catalog} />
    </Suspense>
  );
}
