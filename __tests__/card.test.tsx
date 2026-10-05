import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import CourseCard from "@/components/CourseCard";
import CourseGrid from "@/components/CourseGrid";
import { toLobbyCatalog } from "@/lib/catalog";
import { validateCatalog } from "@/lib/academy-public";
import type { LobbyCourse } from "@/lib/types";
import fixture from "./fixtures/catalog.json";

const BASE = "https://www.faraday-player.com";
const courses: LobbyCourse[] = toLobbyCatalog(
  validateCatalog(structuredClone(fixture))!,
  "live",
  BASE,
).courses;
const bySlug = (slug: string) => {
  const c = courses.find((x) => x.slug === slug);
  if (!c) throw new Error(`fixture has no ${slug}`);
  return c;
};

describe("CourseCard", () => {
  it("renders the subject name, level, reading time and narration", () => {
    render(<CourseCard course={bySlug("data-center-power-foundations")} betaFree />);
    expect(screen.getByText("Power Architecture")).toBeInTheDocument();
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText(/min read/)).toBeInTheDocument();
    expect(screen.getByText("Narrated")).toBeInTheDocument();
  });

  it("names the author", () => {
    render(<CourseCard course={bySlug("data-center-power-foundations")} betaFree />);
    expect(screen.getByText(/Gilbert Faraday/)).toBeInTheDocument();
  });

  it("shows the beta line and no price while beta is free", () => {
    const { container } = render(
      <CourseCard course={{ ...bySlug("the-threat-surface"), priceUSD: 9.99 }} betaFree />,
    );
    expect(screen.getByText("Free during beta")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\$/);
  });

  it("shows a formatted price once beta is over", () => {
    render(
      <CourseCard course={{ ...bySlug("the-threat-surface"), priceUSD: 9.99 }} betaFree={false} />,
    );
    expect(screen.getByText("$9.99")).toBeInTheDocument();
  });

  it("renders no certification badge and no theme pills", () => {
    const { container } = render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    expect(container.textContent).not.toMatch(/certif/i);
    expect(container.textContent).not.toMatch(/\bT-?\d{3}\b/);
  });

  it("renders no domain or tower code", () => {
    for (const course of courses) {
      const { container, unmount } = render(<CourseCard course={course} betaFree />);
      expect(container.textContent).not.toMatch(/\bD[0-9]{1,2}(\.[0-9]+)?\b/);
      expect(container.textContent).not.toMatch(/\bT-?[0-9]{3}\b/);
      unmount();
    }
  });

  it("omits the description block when the catalog carries none", () => {
    const { container } = render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    expect(container.querySelector(".line-clamp-3")).toBeNull();
  });

  it("renders a description when the catalog carries one", () => {
    render(
      <CourseCard
        course={{ ...bySlug("the-threat-surface"), description: "A short, real summary." }}
        betaFree
      />,
    );
    expect(screen.getByText("A short, real summary.")).toBeInTheDocument();
  });

  it("falls back to the cluster label when the catalog publishes no subject", () => {
    render(
      <CourseCard
        course={{ ...bySlug("the-threat-surface"), subject: null, cluster: "Cross-Stack" }}
        betaFree
      />,
    );
    expect(screen.getByText("Cross-Stack")).toBeInTheDocument();
  });

  it("exposes exactly one link per card, pointed at the player", () => {
    const { container } = render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    const links = container.querySelectorAll("a[href]");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `${BASE}/the-threat-surface`);
  });

  it("names the course in its link, and opens in the same tab", () => {
    render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    const link = screen.getByRole("link", { name: "The Threat Surface" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("stretches the link over the card so the whole card is clickable", () => {
    const { container } = render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    expect(container.querySelector("article")).toHaveClass("relative");
    expect(container.querySelector("a")?.className).toMatch(/after:absolute/);
  });

  it("keeps the CTA decorative, so it is not a second tab stop", () => {
    render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    expect(screen.queryByRole("link", { name: /start reading/i })).toBeNull();
    expect(screen.getByText("Start reading")).toHaveAttribute("aria-hidden", "true");
  });

  it("builds a player link with no query string and no course code", () => {
    for (const course of courses) {
      const { container, unmount } = render(<CourseCard course={course} betaFree />);
      const href = container.querySelector("a")!.getAttribute("href")!;
      expect(href).toBe(`${BASE}/${course.slug}`);
      expect(href).not.toMatch(/[?#]/);
      expect(href).not.toMatch(/\bFA-/);
      unmount();
    }
  });

  it("is focusable by keyboard", async () => {
    render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    const link = screen.getByRole("link", { name: "The Threat Surface" });
    link.focus();
    expect(link).toHaveFocus();
  });

  it("is axe clean", async () => {
    const { container } = render(<CourseCard course={bySlug("the-threat-surface")} betaFree />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("CourseGrid", () => {
  it("renders one card per result", () => {
    const { container } = render(<CourseGrid results={courses} betaFree />);
    expect(container.querySelectorAll("article")).toHaveLength(courses.length);
  });

  it("renders the offline state when there is no catalog at all", () => {
    render(<CourseGrid results={[]} betaFree offline />);
    expect(screen.getByText(/catalog is offline/i)).toBeInTheDocument();
  });

  it("renders the no-results invitation when filters exclude everything", () => {
    render(<CourseGrid results={[]} betaFree onClearAll={() => {}} />);
    expect(screen.getByText(/Nothing matches these filters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all filters/i })).toBeInTheDocument();
  });

  it("gives every card in the grid its own player link", () => {
    const { container } = render(<CourseGrid results={courses} betaFree />);
    const hrefs = [...container.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    expect(hrefs).toHaveLength(courses.length);
    expect(new Set(hrefs).size).toBe(courses.length);
    expect(hrefs).toEqual(expect.arrayContaining(courses.map((c) => `${BASE}/${c.slug}`)));
  });

  it("is axe clean across a full grid", async () => {
    const { container } = render(<CourseGrid results={courses} betaFree />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("states no count anywhere", () => {
    const { container } = render(<CourseGrid results={courses} betaFree />);
    expect(container.textContent).not.toMatch(/\d+\s+(courses?|domains?|schools?|towers?)/i);
  });
});
