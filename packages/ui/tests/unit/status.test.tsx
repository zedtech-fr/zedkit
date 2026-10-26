import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { StatusLabel } from "#index.js";
import { UpdatedAgo } from "#index.js";

describe("status label", () => {
  it("announces the named operation", () => {
    render(<StatusLabel tone="loading">Saving report…</StatusLabel>);
    expect(screen.getByRole("status").textContent).toContain("Saving report…");
  });

  it("shows a check for saved states", () => {
    const { container } = render(<StatusLabel tone="saved">Saved</StatusLabel>);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.innerHTML).not.toContain("animate-ping");
  });

  it("shows an ongoing dot while loading", () => {
    const { container } = render(<StatusLabel tone="loading">Saving report…</StatusLabel>);
    expect(container.innerHTML).toContain("motion-safe:animate-ping");
  });

  it("marks errors in destructive tones", () => {
    const { container } = render(<StatusLabel tone="error">Could not save</StatusLabel>);
    expect(container.innerHTML).toContain("text-destructive");
    expect(container.innerHTML).toContain("bg-destructive");
  });

  it("shows an offline icon without a dot", () => {
    const { container } = render(<StatusLabel tone="offline">You are offline</StatusLabel>);
    expect(container.querySelector(".lucide-wifi-off")).not.toBeNull();
  });

  it("spaces icon and text from theme tokens", () => {
    const { container } = render(<StatusLabel tone="loading">Saving report…</StatusLabel>);
    expect(container.innerHTML).toContain("gap-status-label-gap");
    expect(container.innerHTML).toContain("size-status-label-box");
    const offline = render(<StatusLabel tone="offline">You are offline</StatusLabel>);
    expect(offline.container.innerHTML).toContain("size-status-label-icon");
  });

  it("has no axe violations", async () => {
    const { container } = render(<StatusLabel tone="updating">Refreshing events…</StatusLabel>);
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

describe("updated ago", () => {
  it("names seconds, minutes, hours, and days", () => {
    const now = Date.now();
    const seconds = render(<UpdatedAgo date={now - 30_000} />);
    expect(seconds.container.textContent).toBe("Updated 30 seconds ago");
    seconds.unmount();
    const minutes = render(<UpdatedAgo date={now - 5 * 60_000} />);
    expect(minutes.container.textContent).toBe("Updated 5 minutes ago");
    minutes.unmount();
    const hours = render(<UpdatedAgo date={now - 2 * 3_600_000} />);
    expect(hours.container.textContent).toBe("Updated 2 hours ago");
    hours.unmount();
    const days = render(<UpdatedAgo date={now - 4 * 86_400_000} />);
    expect(days.container.textContent).toBe("Updated 4 days ago");
  });

  it("says just now under five seconds", () => {
    const { container } = render(<UpdatedAgo date={Date.now() - 2_000} />);
    expect(container.textContent).toBe("Updated just now");
  });

  it("reads future dates as just now", () => {
    const { container } = render(<UpdatedAgo date={Date.now() + 60_000} />);
    expect(container.textContent).toBe("Updated just now");
  });

  it("accepts a custom prefix", () => {
    const { container } = render(<UpdatedAgo date={Date.now() - 3_000} prefix="Synced" />);
    expect(container.textContent).toBe("Synced just now");
  });
});
