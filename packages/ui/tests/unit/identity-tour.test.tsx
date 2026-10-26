import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_TOUR_STORAGE_KEY, IdentityTour } from "#index.js";

function mockMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
}

const root = document.documentElement;

/** Walk past load, idle and font waits, then through the steps. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockMotion(false);
  root.setAttribute("data-identity", "mist");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  root.removeAttribute("data-identity");
  root.removeAttribute("data-identity-tour");
  root.removeAttribute("style");
  localStorage.clear();
});

describe("IdentityTour", () => {
  it("renders nothing before it starts and is silent for crawlers and screen readers", () => {
    const { container } = render(<IdentityTour />);
    expect(container.querySelector("[data-identity-tour-card]")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("cycles every identity, ends on the settled one and never writes the persisted identity", async () => {
    const seen: string[] = [];
    const record = () => seen.push(root.getAttribute("data-identity") ?? "");
    window.addEventListener("zk-identity-change", record);
    render(<IdentityTour />);
    await advance(2500);
    expect(root.getAttribute("data-identity-tour")).toBe("running");
    expect(screen.getByRole("status").textContent).toMatch(
      /Previewing 6 visual identities/,
    );
    expect(localStorage.getItem(IDENTITY_TOUR_STORAGE_KEY)).toBe("1");
    await advance(6000);
    window.removeEventListener("zk-identity-change", record);
    expect(seen.filter((id, i) => seen[i - 1] !== id)).toEqual([
      "press",
      "tide",
      "volt",
      "maison",
      "glass",
      "mist",
    ]);
    expect(root.getAttribute("data-identity")).toBe("mist");
    expect(document.querySelector("[data-identity-tour-card]")).toBeNull();
    expect(localStorage.getItem("zk-identity")).toBeNull();
    await advance(1000);
    expect(root.hasAttribute("data-identity-tour")).toBe(false);
    expect(root.style.getPropertyValue("--spacing")).toBe("");
  });

  it("skips on Escape and settles on the stored identity", async () => {
    root.setAttribute("data-identity", "tide");
    render(<IdentityTour />);
    await advance(2500);
    expect(document.querySelector("[data-identity-tour-card]")).not.toBeNull();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(root.getAttribute("data-identity")).toBe("tide");
    expect(document.querySelector("[data-identity-tour-card]")).toBeNull();
  });

  it("does not replay once the flag is set", async () => {
    localStorage.setItem(IDENTITY_TOUR_STORAGE_KEY, "1");
    render(<IdentityTour />);
    await advance(3000);
    expect(root.hasAttribute("data-identity-tour")).toBe(false);
    expect(root.getAttribute("data-identity")).toBe("mist");
  });

  it("does not play, and sets no flag, under reduced motion", async () => {
    mockMotion(true);
    render(<IdentityTour />);
    await advance(3000);
    expect(root.hasAttribute("data-identity-tour")).toBe(false);
    expect(localStorage.getItem(IDENTITY_TOUR_STORAGE_KEY)).toBeNull();
  });
});
