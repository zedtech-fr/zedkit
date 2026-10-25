import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailPanel, LivePulse } from "#index.js";

describe("DetailPanel", () => {
  it("renders label/value rows", () => {
    render(<DetailPanel items={[{ label: "Name", value: "Ada" }]} />);
    expect(screen.getByText("Name").textContent).toBe("Name");
    expect(screen.getByText("Ada").textContent).toBe("Ada");
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
});
