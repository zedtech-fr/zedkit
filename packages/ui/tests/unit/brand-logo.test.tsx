import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { BrandLogo } from "#index.js";

const MARK = <path d="M0 24 16 0l16 24Z" />;

describe("BrandLogo", () => {
  it("is a named image with no axe violations", async () => {
    const { container } = render(
      <BrandLogo title="Harbor Studio" viewBox="0 0 32 24">
        {MARK}
      </BrandLogo>,
    );
    expect(screen.getByRole("img", { name: "Harbor Studio" })).toBeTruthy();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("paints with currentColor and keeps the viewBox", () => {
    const { container } = render(
      <BrandLogo title="Harbor Studio" viewBox="0 0 32 24" className="text-primary">
        {MARK}
      </BrandLogo>,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 32 24");
    expect(svg?.getAttribute("class")).toContain("text-primary");
  });

  it("is hidden from assistive tech when the name is written next to it", () => {
    const { container } = render(
      <BrandLogo title="" viewBox="0 0 32 24">
        {MARK}
      </BrandLogo>,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
