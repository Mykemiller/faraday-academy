// FDY-450 · CC-BRAND-MASTHEAD-1.0: the /academy frame (rendered by the gated layout, FDY-418) renders the shared, vendored Faraday masthead
// above the lobby, with the Academy nav in the AppBar and the skip link landing on the lobby's <main>.
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import AcademyFrame from "@/components/AcademyFrame";
import LobbyShell from "@/components/LobbyShell";
import { MASTHEAD_VERSION } from "@/lib/faraday-masthead/core.ts";
import { toLobbyCatalog } from "@/lib/catalog";
import { validateCatalog } from "@/lib/academy-public";
import fixture from "./fixtures/catalog.json";

const catalog = toLobbyCatalog(
  validateCatalog(structuredClone(fixture))!,
  "live",
  "https://www.faraday-player.com",
);

function setup() {
  return render(
    <AcademyFrame>
      <LobbyShell catalog={catalog} />
    </AcademyFrame>,
  );
}

describe("Academy masthead", () => {
  it("renders exactly one banner: the vendored masthead, linking home to the lobby", () => {
    const { container } = setup();
    const banners = screen.getAllByRole("banner");
    expect(banners).toHaveLength(1);
    expect(banners[0]).toHaveAttribute("data-fm", MASTHEAD_VERSION);
    expect(within(banners[0]).getByRole("link", { name: "Faraday home" })).toHaveAttribute("href", "/academy");
    expect(container.querySelector(".fm-markl")).toHaveAttribute("href", "/academy");
    expect(within(banners[0]).getByText("Faraday Academy")).toHaveClass("fm-app");
    expect(within(banners[0]).getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "https://www.faraday-player.com",
    );
  });

  it("puts the Academy nav in the AppBar and the skip link on the lobby's main", () => {
    const { container } = setup();
    const nav = screen.getByRole("navigation", { name: "Faraday Academy" });
    expect(within(nav).getByRole("link", { name: "Courses" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(container.querySelectorAll("main#main")).toHaveLength(1);
  });

  it("is axe-clean with the lobby underneath", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
