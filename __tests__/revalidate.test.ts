import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const SECRET = "a-long-enough-shared-secret-value";

async function route() {
  return import("@/app/api/revalidate/route");
}

function post(headers: Record<string, string> = {}) {
  return new Request("https://faraday-academy.vercel.app/api/revalidate", {
    method: "POST",
    headers,
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockClear();
    vi.stubEnv("ACADEMY_REVALIDATE_SECRET", SECRET);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 204 and revalidates the academy tag with the right secret", async () => {
    const { POST } = await route();
    const res = await POST(post({ "x-academy-revalidate-secret": SECRET }));
    expect(res.status).toBe(204);
    expect(revalidateTag).toHaveBeenCalledWith("academy", "max");
  });

  it("accepts the player's alternate header name too", async () => {
    const { POST } = await route();
    const res = await POST(post({ "x-revalidate-secret": SECRET }));
    expect(res.status).toBe(204);
    expect(revalidateTag).toHaveBeenCalledWith("academy", "max");
  });

  it("prefers x-academy-revalidate-secret when both are present", async () => {
    const { POST } = await route();
    const res = await POST(post({
      "x-academy-revalidate-secret": SECRET,
      "x-revalidate-secret": "wrong",
    }));
    expect(res.status).toBe(204);
  });

  it("returns 401 with no secret at all", async () => {
    const { POST } = await route();
    const res = await POST(post());
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong secret of the same length", async () => {
    const { POST } = await route();
    const wrong = "b".repeat(SECRET.length);
    expect(wrong).toHaveLength(SECRET.length);
    const res = await POST(post({ "x-academy-revalidate-secret": wrong }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("returns 401 for a secret of a different length, without throwing", async () => {
    const { POST } = await route();
    const res = await POST(post({ "x-academy-revalidate-secret": "short" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when the server has no secret configured", async () => {
    vi.stubEnv("ACADEMY_REVALIDATE_SECRET", "");
    const { POST } = await route();
    const res = await POST(post({ "x-academy-revalidate-secret": SECRET }));
    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("gives the same body for every rejection, so nothing leaks", async () => {
    const { POST } = await route();
    const missing = await POST(post());
    const wrong = await POST(post({ "x-academy-revalidate-secret": "x".repeat(SECRET.length) }));
    expect(await missing.text()).toBe(await wrong.text());
    expect(missing.headers.get("Cache-Control")).toBe("no-store");
  });

  it("never caches its response", async () => {
    const { POST } = await route();
    const res = await POST(post({ "x-academy-revalidate-secret": SECRET }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("other methods", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("ACADEMY_REVALIDATE_SECRET", SECRET);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers 405 with an Allow header", async () => {
    const mod = await route();
    for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD"] as const) {
      const res = await mod[method]();
      expect(res.status).toBe(405);
      expect(res.headers.get("Allow")).toBe("POST");
    }
  });

  it("does not revalidate on a GET, even with a valid secret", async () => {
    revalidateTag.mockClear();
    const { GET } = await route();
    await GET();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
