import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdentityCycle, IdentityScope } from "#index.js";

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
const layers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-identity-cycle-layer]"));

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
  localStorage.clear();
});

describe("IdentityScope", () => {
  it("applies an identity to its subtree and leaves <html> alone", () => {
    const { container } = render(
      <IdentityScope identity="press">scene</IdentityScope>,
    );
    const scope = container.querySelector("[data-identity-scope]");
    expect(scope?.getAttribute("data-identity")).toBe("press");
    expect(root.getAttribute("data-identity")).toBe("mist");
  });
});

describe("IdentityCycle", () => {
  it("renders the real scene alone before it starts", () => {
    const { container, getByText } = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    expect(getByText("scene")).toBeTruthy();
    expect(layers(container)).toHaveLength(0);
  });

  it("crosses every identity inside the hero, ends on the page's own, never touches <html> or storage", async () => {
    const seen: string[] = [];
    const watcher = new MutationObserver(() =>
      seen.push(root.getAttribute("data-identity") ?? ""),
    );
    watcher.observe(root, { attributes: true });
    const { container } = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(400);
    const mounted = layers(container);
    expect(mounted.map((layer) => layer.getAttribute("data-identity-cycle-layer"))).toEqual([
      "press",
      "tide",
      "volt",
      "maison",
      "glass",
      "mist",
    ]);
    for (const layer of mounted) {
      expect(layer.getAttribute("aria-hidden")).toBe("true");
      expect(layer.hasAttribute("inert")).toBe(true);
    }
    await advance(1500);
    // Identities pile up: those already shown stay opaque, the next ones wait at zero.
    const shown = layers(container).filter((l) => l.className.includes("opacity-100"));
    expect(shown.length).toBeGreaterThanOrEqual(2);
    expect(shown.length).toBeLessThan(6);
    expect(layers(container).slice(0, shown.length)).toEqual(shown);
    await advance(3000);
    expect(layers(container)).toHaveLength(0);
    expect(seen).toEqual([]);
    expect(root.getAttribute("data-identity")).toBe("mist");
    expect(localStorage.length).toBe(0);
    watcher.disconnect();
  });

  it("repeats the scene's text unchanged in every layer and keeps the real one first", async () => {
    const { container } = render(
      <IdentityCycle>
        <h1>Title</h1>
      </IdentityCycle>,
    );
    await advance(400);
    const heads = Array.from(container.querySelectorAll("h1"));
    expect(heads).toHaveLength(7);
    expect(heads.map((h) => h.textContent)).toEqual(Array(7).fill("Title"));
    expect(heads[0]?.closest("[data-identity-cycle-layer]")).toBeNull();
  });

  it("paints each identity's backdrop only when asked, and measures the way to the window edges", async () => {
    const plain = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(400);
    expect(plain.container.querySelectorAll("[data-identity-backdrop]")).toHaveLength(0);
    plain.unmount();
    const { container } = render(
      <IdentityCycle backdrop>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(400);
    expect(container.querySelectorAll("[data-identity-backdrop]")).toHaveLength(6);
    const rootEl = container.querySelector<HTMLElement>("[data-identity-cycle]");
    expect(rootEl?.style.getPropertyValue("--zk-cycle-bleed-l")).toBe("0px");
    expect(rootEl?.style.getPropertyValue("--zk-cycle-bleed-r")).toMatch(/px$/);
  });

  it("finishes in under four seconds and plays again on a new mount", async () => {
    const first = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(200 + 80 + 5 * 500 + 400 + 150 + 450);
    expect(layers(first.container)).toHaveLength(0);
    first.unmount();
    const second = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(400);
    expect(layers(second.container)).toHaveLength(6);
  });

  it("ends on the visitor's identity", async () => {
    root.setAttribute("data-identity", "tide");
    const { container } = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(400);
    const ids = layers(container).map((l) => l.getAttribute("data-identity-cycle-layer"));
    expect(ids[ids.length - 1]).toBe("tide");
    expect(ids).toHaveLength(6);
  });

  it("is cut by the first key press", async () => {
    const { container } = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(900);
    expect(layers(container).length).toBeGreaterThan(0);
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    });
    await advance(600);
    expect(layers(container)).toHaveLength(0);
  });

  it("never plays under reduced motion", async () => {
    mockMotion(true);
    const { container } = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(6000);
    expect(layers(container)).toHaveLength(0);
  });

  it("never plays when disabled", async () => {
    const { container } = render(
      <IdentityCycle enabled={false}>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(6000);
    expect(layers(container)).toHaveLength(0);
  });
});
