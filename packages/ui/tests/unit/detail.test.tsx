import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailPanel, DetailPanelRow, LivePulse } from "#index.js";

describe("DetailPanel", () => {
  it("renders label/value rows", () => {
    render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    expect(screen.getByText("Name").textContent).toBe("Name");
    expect(screen.getByText("Ada").textContent).toBe("Ada");
  });

  it("styles rows from design tokens", () => {
    const { container } = render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    const row = container.querySelector("dl > div");
    expect(row?.classList.contains("gap-detail-panel-gap")).toBe(true);
    expect(row?.classList.contains("px-detail-panel-inline")).toBe(true);
    expect(row?.classList.contains("py-detail-panel-block")).toBe(true);
    expect(row?.className).not.toMatch(/(^|\s)(gap-4|px-4|py-3)(\s|$)/);
  });
});

describe("DetailPanelRow", () => {
  it("composes a custom row with explicit label and value", () => {
    render(
      <dl>
        <DetailPanelRow label="Region" value="eu" />
      </dl>,
    );
    expect(screen.getByText("Region").tagName).toBe("DT");
    expect(screen.getByText("eu").tagName).toBe("DD");
  });
});

describe("LivePulse", () => {
  it("shows the live label when active", () => {
    render(<LivePulse />);
    expect(screen.getByRole("status").textContent).toContain("Live");
  });

  it("shows idle when inactive", () => {
    render(<LivePulse active={false} />);
    expect(screen.getByRole("status").textContent).toContain("Idle");
  });

  it("uses the token-driven gap with no arbitrary values", () => {
    render(<LivePulse />);
    const className = screen.getByRole("status").className;
    expect(className).toContain("gap-live-pulse-gap");
    expect(className).not.toContain("[");
  });
});
