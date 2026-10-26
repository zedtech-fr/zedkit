import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Logo } from "#index.js";

describe("Logo", () => {
  it("is a named image with no axe violations", async () => {
    const { container } = render(<Logo />);
    expect(screen.getByRole("img", { name: "zedkit" })).toBeTruthy();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("paints with currentColor so it follows the text colour", () => {
    const { container } = render(<Logo className="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
    expect(svg?.getAttribute("class")).toContain("text-primary");
  });

  it("is hidden from assistive tech when the name is written next to it", () => {
    const { container } = render(<Logo title="" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
