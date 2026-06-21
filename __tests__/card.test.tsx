import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

function course(over: Partial<Course>): Course {
  return {
    id: "FA-D2-201", title: "800V DC Power Distribution", slug: "x",
    description: "The 415V AC to 800V DC transition.",
    school: { id: "D2", name: "Power Architecture", cluster: "Physical Stack" },
    level: "201", programType: "Course", personas: ["Engineer", "Operator", "Executive", "Investor"],
    durationMinutes: 90, priceUSD: 9.99, isFree: false, isCertification: false,
    maturity: "Established", themes: ["T-001"], rating: null, ratingCount: null,
    thumbnailUrl: null, url: "https://example.com/c/x", status: "Published",
    updatedAt: "2026-06-01T00:00:00Z", ...over,
  };
}

describe("CourseCard", () => {
  it("renders a paid price and an enabled CTA", () => {
    render(<CourseCard course={course({})} />);
    expect(screen.getByText("$9.99")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view course/i })).toHaveAttribute("href", "https://example.com/c/x");
  });

  it("renders Free for a free course", () => {
    render(<CourseCard course={course({ priceUSD: 0, isFree: true })} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("shows the cert badge only when isCertification", () => {
    const { rerender } = render(<CourseCard course={course({})} />);
    expect(screen.queryByText("Cert")).not.toBeInTheDocument();
    rerender(<CourseCard course={course({ isCertification: true, programType: "Certification" })} />);
    expect(screen.getByText("Cert")).toBeInTheDocument();
  });

  it("falls back to a monogram tile when no thumbnail (no broken img)", () => {
    const { container } = render(<CourseCard course={course({ thumbnailUrl: null })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("D2")).toBeInTheDocument();
  });

  it("renders no rating when rating is null (never a fake 0★)", () => {
    const { container } = render(<CourseCard course={course({ rating: null })} />);
    expect(container.textContent).not.toMatch(/0\.0|★/);
  });

  it("renders rating only when real", () => {
    render(<CourseCard course={course({ rating: 4.7, ratingCount: 38 })} />);
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("(38)")).toBeInTheDocument();
  });

  it("shows disabled Coming soon when url is null", () => {
    render(<CourseCard course={course({ url: null })} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toHaveAttribute("aria-disabled", "true");
  });

  it("caps persona tags at 3 with a +N overflow", () => {
    render(<CourseCard course={course({ personas: ["Engineer", "Operator", "Executive", "Investor"] })} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("has no serious accessibility violations", async () => {
    const { container } = render(<CourseCard course={course({})} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
