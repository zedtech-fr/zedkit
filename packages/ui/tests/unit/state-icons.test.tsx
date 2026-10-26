import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Checkmark } from "#index.js";
import { ProgressBar } from "#index.js";
import { StatusDot } from "#index.js";

describe("status dot", () => {
  it("renders the success tone color", () => {
    const { container } = render(<StatusDot tone="success" />);
    expect(container.innerHTML).toContain("bg-success");
  });

  it("pings for ongoing tones and stays static otherwise", () => {
    const active = render(<StatusDot tone="active" />);
    expect(active.container.innerHTML).toContain("motion-safe:animate-ping");
    active.unmount();
    const idle = render(<StatusDot tone="idle" />);
    expect(idle.container.innerHTML).not.toContain("animate-ping");
    idle.unmount();
    const success = render(<StatusDot tone="success" />);
    expect(success.container.innerHTML).not.toContain("animate-ping");
  });

  it("lets pulse override the tone default", () => {
    const forced = render(<StatusDot tone="idle" pulse />);
    expect(forced.container.innerHTML).toContain("animate-ping");
    forced.unmount();
    const muted = render(<StatusDot tone="active" pulse={false} />);
    expect(muted.container.innerHTML).not.toContain("animate-ping");
  });

  it("is decorative for assistive tech", () => {
    const { container } = render(<StatusDot tone="warning" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sizes the dot from theme tokens", () => {
    const { container } = render(<StatusDot tone="active" />);
    expect(container.innerHTML).toContain("size-status-dot");
    expect(container.innerHTML).not.toContain("size-2");
  });

  it("renders without a color when the tone is unknown", () => {
    const { container } = render(<StatusDot tone={"bogus" as "active"} />);
    expect(container.innerHTML).not.toContain("undefined");
    expect(container.firstElementChild).not.toBeNull();
  });
});

describe("progress bar", () => {
  it("exposes value and bounds to assistive tech", () => {
    render(<ProgressBar value={40} label="Uploading report" />);
    const bar = screen.getByRole("progressbar", { name: "Uploading report" });
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("clamps out-of-range values", () => {
    const over = render(<ProgressBar value={250} max={200} label="Sync" />);
    expect(over.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("200");
    over.unmount();
    const under = render(<ProgressBar value={-5} label="Sync" />);
    expect(under.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("fills segments in proportion to the value", () => {
    const { container } = render(<ProgressBar value={40} label="Uploading report" />);
    const filled = container.querySelectorAll(".bg-primary");
    expect(filled.length).toBe(4);
  });

  it("treats non-finite input as empty with a sane scale", () => {
    render(<ProgressBar value={Number.NaN} max={Number.NaN} label="Sync" />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
  });
});

describe("checkmark", () => {
  it("is decorative without a label", () => {
    const { container } = render(<Checkmark />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("path")?.getAttribute("class")).toContain("stroke-dasharray");
  });

  it("names itself with a label", () => {
    render(<Checkmark label="Saved" />);
    expect(screen.getByRole("img", { name: "Saved" })).not.toBeNull();
  });
});

describe("state icons a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <StatusDot tone="active" />
        <ProgressBar value={40} label="Uploading report" />
        <Checkmark label="Saved" />
      </>,
    );
    const results = await axe(container, {
      rules: {
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "document-title": { enabled: false },
        "html-has-lang": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
