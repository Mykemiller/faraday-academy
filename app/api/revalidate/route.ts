// On-demand revalidation for the lobby.
//
// Called by the academy_courses status-change trigger through net.http_post.
// The shared secret lives in Vault on the database side and in
// ACADEMY_REVALIDATE_SECRET here.
//
// Two header names are accepted because the player's own /api/revalidate
// accepts both (`x-academy-revalidate-secret`, then `x-revalidate-secret`) and
// the same trigger calls both routes. Reading the deployed trigger body to pin
// down which one it actually sends needs database access this run did not have,
// so the lobby matches the player rather than guessing one and failing closed.

import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { ACADEMY_TAG } from "@/lib/academy-public";

export const dynamic = "force-dynamic";

const HEADERS = ["x-academy-revalidate-secret", "x-revalidate-secret"] as const;

// Constant-time: a fast string compare on a shared secret is a free oracle.
function secretMatches(given: string | null): boolean {
  const expected = process.env.ACADEMY_REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request): Promise<Response> {
  const given = HEADERS.reduce<string | null>(
    (found, name) => found ?? request.headers.get(name),
    null,
  );

  if (!secretMatches(given)) {
    // Identical response whether the secret is missing, wrong or unconfigured.
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  // "max" marks the tag stale and serves stale-while-revalidate, which matches
  // the edge function's own cache headers. A status change does not need a
  // blocking purge, and the single-argument form is deprecated in Next 16.
  revalidateTag(ACADEMY_TAG, "max");

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

const methodNotAllowed = async (): Promise<Response> =>
  new Response(null, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const HEAD = methodNotAllowed;
