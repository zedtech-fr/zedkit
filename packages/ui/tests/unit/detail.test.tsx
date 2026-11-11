import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DetailPanel,
  DetailPanelRow,
  LivePulse,
  ZedkitUiProvider,
  zedkitUiMessagesFr,
} from "#index.js";

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
    expect(row?.className).toContain("py-detail-panel-block");
    expect(row?.className).not.toContain("py-3");
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
    expect(value.classList.contains("content-shrink")).toBe(true);
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
    expect(screen.getByRole("status", { name: "Idle" }).textContent).toContain("Idle");
  });

  it("uses inactiveLabel when idle", () => {
    render(<LivePulse active={false} inactiveLabel="Paused" />);
    expect(screen.getByRole("status", { name: "Paused" }).textContent).toContain("Paused");
    expect(screen.queryByText("Idle")).toBeNull();
  });

  it("ignores inactiveLabel while active", () => {
    render(<LivePulse inactiveLabel="Paused" />);
    expect(screen.getByRole("status", { name: "Live" }).textContent).toContain("Live");
    expect(screen.queryByText("Paused")).toBeNull();
  });

  it("keeps label as the live word only", () => {
    render(<LivePulse active={false} label="Latest" />);
    expect(screen.getByRole("status", { name: "Idle" }).textContent).toContain("Idle");
    expect(screen.queryByText("Latest")).toBeNull();
  });

  it("uses French idle chrome until inactiveLabel is passed", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <LivePulse active={false} />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("status", { name: "Inactif" }).textContent).toContain("Inactif");
  });

  it("honors an empty inactiveLabel as no idle word", () => {
    render(<LivePulse active={false} inactiveLabel="" />);
    const status = screen.getByRole("status");
    expect(status.textContent).not.toContain("Idle");
    expect(status.getAttribute("aria-label")).toBe("");
  });

  it("uses the canonical scale gap with no arbitrary values", () => {
    render(<LivePulse />);
    const className = screen.getByRole("status").className;
    expect(className).toContain("gap-icon");
    expect(className).not.toContain("gap-1.5");
    expect(className).not.toContain("[");
  });
});
