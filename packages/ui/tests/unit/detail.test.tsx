import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as Kit from "#index.js";
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

  it("defaults to a boxed list with divide-y", () => {
    const { container } = render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    const panel = container.querySelector("dl");
    expect(panel?.classList.contains("divide-y")).toBe(true);
    expect(panel?.getAttribute("data-variant")).toBe("list");
  });

  it("treats variant=list as the default boxed list", () => {
    const omitted = render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    const listed = render(<DetailPanel variant="list" items={[{ label: "Name", value: "Ada" }]} />);
    expect(listed.container.querySelector("dl")?.className).toBe(omitted.container.querySelector("dl")?.className);
    expect(listed.container.querySelector("dl")?.getAttribute("data-variant")).toBe("list");
  });

  it("lays items out as a stat grid", () => {
    const { container } = render(
      <DetailPanel
        variant="grid"
        items={[
          { label: "Requests", value: "12,480" },
          { label: "Uptime", value: "99.9%" },
        ]}
      />,
    );
    const panel = container.querySelector("dl");
    expect(panel?.tagName).toBe("DL");
    expect(panel?.classList.contains("sm:grid-pair")).toBe(true);
    expect(panel?.classList.contains("gap-stack-md")).toBe(true);
    expect(panel?.classList.contains("divide-y")).toBe(false);
    expect(panel?.getAttribute("data-variant")).toBe("grid");
    expect(screen.getByText("Requests").tagName).toBe("DT");
    expect(screen.getByText("12,480").tagName).toBe("DD");
    expect(screen.getByText("12,480").classList.contains("text-stat")).toBe(true);
  });

  it("renders an empty definition list when items is empty", () => {
    const { container } = render(<DetailPanel items={[]} />);
    expect(container.querySelector("dl")).not.toBeNull();
  });

  it("renders one grid cell as a definition pair", () => {
    render(<DetailPanel variant="grid" items={[{ label: "Uptime", value: "99.9%" }]} />);
    expect(screen.getByText("Uptime").tagName).toBe("DT");
    expect(screen.getByText("99.9%").tagName).toBe("DD");
  });

  it("keeps unbreakable grid values inside the cell", () => {
    render(
      <DetailPanel variant="grid" items={[{ label: "ID", value: "evt_0123456789abcdef0123456789abcdef" }]} />,
    );
    const value = screen.getByText("evt_0123456789abcdef0123456789abcdef");
    expect(value.tagName).toBe("DD");
    expect(value.classList.contains("content-shrink")).toBe(true);
    expect(value.classList.contains("break-words")).toBe(true);
  });

  it("puts a ReactNode value in the grid definition", () => {
    render(
      <DetailPanel variant="grid" items={[{ label: "Status", value: <span>Ready</span> }]} />,
    );
    expect(screen.getByText("Ready").closest("dd")).not.toBeNull();
  });

  it("merges className onto the grid host", () => {
    const { container } = render(
      <DetailPanel variant="grid" className="mt-status" items={[{ label: "Name", value: "Ada" }]} />,
    );
    expect(container.querySelector("dl")?.classList.contains("mt-status")).toBe(true);
  });

  it("does not export StatGrid", () => {
    expect(Kit).not.toHaveProperty("StatGrid");
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

  it("hides an empty inactiveLabel visually and keeps the idle accessible name", () => {
    render(<LivePulse active={false} inactiveLabel="" />);
    const status = screen.getByRole("status", { name: "Idle" });
    expect(status.textContent).not.toContain("Idle");
    expect(status.getAttribute("aria-label")).toBe("Idle");
  });

  it("treats whitespace-only inactiveLabel as a hidden idle word", () => {
    render(<LivePulse active={false} inactiveLabel=" " />);
    const status = screen.getByRole("status", { name: "Idle" });
    expect(status.textContent).not.toContain("Idle");
    expect(status.getAttribute("aria-label")).toBe("Idle");
  });

  it("keeps the French idle name when the idle word is hidden", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <LivePulse active={false} inactiveLabel="" />
      </ZedkitUiProvider>,
    );
    const status = screen.getByRole("status", { name: "Inactif" });
    expect(status.textContent).not.toContain("Inactif");
    expect(status.getAttribute("aria-label")).toBe("Inactif");
  });

  it("uses the canonical scale gap with no arbitrary values", () => {
    render(<LivePulse />);
    const className = screen.getByRole("status").className;
    expect(className).toContain("gap-icon");
    expect(className).not.toContain("gap-1.5");
    expect(className).not.toContain("[");
  });
});
