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
    expect(layers(container).filter((l) => l.className.includes("opacity-100"))).toHaveLength(1);
    await advance(3000);
    expect(layers(container)).toHaveLength(0);
    expect(seen).toEqual([]);
    expect(root.getAttribute("data-identity")).toBe("mist");
    expect(localStorage.length).toBe(0);
    watcher.disconnect();
  });

  it("finishes in under four seconds and plays again on a new mount", async () => {
    const first = render(
      <IdentityCycle>
        <p>scene</p>
      </IdentityCycle>,
    );
    await advance(200 + 80 + 5 * 550 + 400 + 250 + 50);
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
