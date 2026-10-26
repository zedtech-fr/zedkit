import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";
import { IconLabel } from "#index.js";

describe("IconLabel", () => {
  it("renders decorative icon and visible label text", () => {
    const { container } = render(
      <IconLabel icon={Search} className="min-w-0">
        <code>explorer</code>
      </IconLabel>,
    );
    expect(screen.getByText("explorer")).toBeTruthy();
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
    expect(container.firstElementChild?.classList.contains("min-w-0")).toBe(true);
  });

  it("styles size and gap from design tokens", () => {
    const { container } = render(
      <IconLabel icon={Search}>
        <span>Label</span>
      </IconLabel>,
    );
    expect(container.innerHTML).toContain("size-icon-label");
    expect(container.innerHTML).toContain("gap-icon-label-gap");
    expect(container.innerHTML).toContain("text-muted-foreground");
  });
});
