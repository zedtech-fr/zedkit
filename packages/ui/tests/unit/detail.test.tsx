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
    expect(row?.classList.contains("gap-4")).toBe(true);
    expect(row?.classList.contains("px-4")).toBe(true);
    expect(row?.classList.contains("py-detail-panel-block")).toBe(true);
    expect(row?.className).not.toMatch(/(^|\s)py-3(\s|$)/);
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

  it("contains unbreakable values inside the grid (no blowout)", () => {
    render(
      <dl>
        <DetailPanelRow label="ID" value="evt_0123456789abcdef0123456789abcdef" />
      </dl>,
    );
    const value = screen.getByText("evt_0123456789abcdef0123456789abcdef");
    expect(value.classList.contains("min-w-0")).toBe(true);
    expect(value.classList.contains("break-words")).toBe(true);
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

  it("uses the canonical scale gap with no arbitrary values", () => {
    render(<LivePulse />);
    const className = screen.getByRole("status").className;
    expect(className).toContain("gap-1.5");
    expect(className).not.toContain("gap-live-pulse-gap");
    expect(className).not.toContain("[");
  });
});
